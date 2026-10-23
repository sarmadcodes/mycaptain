import { Router } from 'express';
import { Schema, Types, model, type HydratedDocument } from 'mongoose';
import { z } from 'zod';

import { AppError, badRequest, notFound } from '@/lib/errors';
import { notify } from '@/lib/notify';
import { emit } from '@/lib/realtime';
import { me, requireAuth, requireRole } from '@/middleware/auth';
import { body, parse } from '@/middleware/validate';
import { BookingModel } from '@/models/booking';
import { CompanyModel } from '@/models/company';
import { toJSON } from '@/models/shared';
import { UserModel } from '@/models/user';

// Partner payout statements. A partner is owed the booking subtotal (the customer total less
// the platform fee) for every completed booking. Each booking is counted in one statement only.

export type Payout = {
  company: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  bookings: Types.ObjectId[];
  count: number;
  amount: number;
  fees: number;
  status: 'scheduled' | 'paid';
  reference?: string;
  paidAt?: Date;
};
export type PayoutDoc = HydratedDocument<Payout>;

const payoutSchema = new Schema<Payout>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
    count: { type: Number, required: true },
    amount: { type: Number, required: true },
    fees: { type: Number, required: true },
    status: { type: String, enum: ['scheduled', 'paid'], default: 'scheduled', index: true },
    reference: { type: String, maxlength: 80 },
    paidAt: Date,
  },
  { timestamps: true, toJSON },
);
export const PayoutModel = model<Payout>('Payout', payoutSchema);

const DONE = ['completed', 'closed'] as const;

// Completed bookings in the period that no statement covers yet, grouped by company.
async function unpaid(from: Date, to: Date) {
  return BookingModel.aggregate<{ _id: Types.ObjectId; bookings: Types.ObjectId[]; count: number; amount: number; fees: number }>([
    { $match: { status: { $in: DONE }, completedAt: { $gte: from, $lt: to }, company: { $exists: true }, payout: { $exists: false } } },
    { $group: { _id: '$company', bookings: { $push: '$_id' }, count: { $sum: 1 }, amount: { $sum: '$price.subtotal' }, fees: { $sum: '$price.fee' } } },
  ]);
}

// Creates statements for every company with unpaid work in the period. Used by the admin and the weekly job.
export async function generatePayouts(from: Date, to: Date) {
  const groups = await unpaid(from, to);
  const created: PayoutDoc[] = [];
  for (const g of groups) {
    const { _id: company, ...totals } = g;
    const p = await PayoutModel.create({ company, periodStart: from, periodEnd: to, ...totals });
    // Claim the bookings; anything already claimed by a concurrent run is skipped by the filter.
    await BookingModel.updateMany({ _id: { $in: g.bookings }, payout: { $exists: false } }, { $set: { payout: p._id } });
    created.push(p);
    const owners = await UserModel.find({ company: g._id, role: 'partner', status: 'active' }).select('_id').lean();
    await notify(owners.map((o) => String(o._id)), {
      title: 'Payout statement ready',
      body: `PKR ${g.amount.toLocaleString('en-PK')} for ${g.count} completed booking${g.count === 1 ? '' : 's'}.`,
      tone: 'green',
    });
  }
  return created;
}

export const payoutsRouter = Router();
const admin = [requireAuth, requireRole('admin')] as const;
const period = z.object({ from: z.coerce.date(), to: z.coerce.date() }).refine((v) => v.from < v.to, 'The start must be before the end.');

payoutsRouter.get('/admin/payouts/preview', ...admin, async (req, res) => {
  const { from, to } = parse(period, req.query);
  const groups = await unpaid(from, to);
  const names = await CompanyModel.find({ _id: { $in: groups.map((g) => g._id) } }).select('legalName tradingName').lean();
  res.json({
    items: groups.map((g) => {
      const c = names.find((n) => String(n._id) === String(g._id));
      return { company: { id: String(g._id), name: c?.tradingName || c?.legalName }, count: g.count, amount: g.amount, fees: g.fees };
    }),
  });
});

payoutsRouter.post('/admin/payouts/generate', ...admin, body(period), async (req, res) => {
  const { from, to } = req.body as { from: Date; to: Date };
  const created = await generatePayouts(new Date(from), new Date(to));
  emit('payouts:updated', {}, { admins: true });
  res.status(201).json({ created: created.length });
});

payoutsRouter.get('/admin/payouts', ...admin, async (req, res) => {
  const q = parse(z.object({ status: z.enum(['scheduled', 'paid']).optional() }), req.query);
  const items = await PayoutModel.find(q.status ? { status: q.status } : {})
    .sort({ periodEnd: -1, createdAt: -1 })
    .limit(200)
    .select('-bookings')
    .populate('company', 'legalName tradingName ref');
  res.json({ items });
});

payoutsRouter.post(
  '/admin/payouts/:id/paid',
  ...admin,
  body(z.object({ reference: z.string().trim().min(3, 'Enter the bank transfer reference.').max(80) })),
  async (req, res) => {
    const { id } = parse(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }), req.params);
    const p = await PayoutModel.findById(id);
    if (!p) throw notFound('Payout');
    if (p.status === 'paid') throw new AppError(409, 'already_paid', 'This payout is already marked paid.');
    p.status = 'paid';
    p.reference = (req.body as { reference: string }).reference;
    p.paidAt = new Date();
    await p.save();
    const owners = await UserModel.find({ company: p.company, role: 'partner', status: 'active' }).select('_id').lean();
    await notify(owners.map((o) => String(o._id)), {
      title: 'Payout sent',
      body: `PKR ${p.amount.toLocaleString('en-PK')} transferred, reference ${p.reference}.`,
      tone: 'green',
    });
    emit('payouts:updated', {}, { admins: true, companies: [String(p.company)] });
    res.json({ payout: p });
  },
);

// Partner's own statements, with the bookings each one covers.
payoutsRouter.get('/companies/me/payouts', requireAuth, requireRole('partner'), async (req, res) => {
  const company = me(req).company;
  if (!company) throw badRequest('No company on this account.');
  const items = await PayoutModel.find({ company }).sort({ periodEnd: -1 }).limit(100).populate('bookings', 'code service completedAt price.subtotal');
  // Work done but not yet on a statement.
  const [pending] = await BookingModel.aggregate<{ count: number; amount: number }>([
    { $match: { company: new Types.ObjectId(company), status: { $in: DONE }, payout: { $exists: false } } },
    { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$price.subtotal' } } },
  ]);
  res.json({ items, pending: { count: pending?.count ?? 0, amount: pending?.amount ?? 0 } });
});
