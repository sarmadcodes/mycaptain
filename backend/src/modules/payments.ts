import { randomBytes } from 'node:crypto';

import { Router } from 'express';
import { Schema, Types, model } from 'mongoose';
import { z } from 'zod';

import { env } from '@/config/env';
import { sendEmail } from '@/lib/email';
import { AppError } from '@/lib/errors';
import { notify } from '@/lib/notify';
import { me, requireAuth, requireRole } from '@/middleware/auth';
import { body, parse } from '@/middleware/validate';
import { toJSON } from '@/models/shared';
import { UserModel } from '@/models/user';

import { broadcast, loadBooking, refId } from './bookings';

// Payments. PAYMENT_PROVIDER=demo completes every checkout instantly without moving money,
// so the whole booking flow can be used before a real provider (JazzCash, Easypaisa, cards) is connected.

export const PAY_METHODS = ['card', 'wallet', 'bank'] as const;

export type Payment = {
  booking: Types.ObjectId;
  customer: Types.ObjectId;
  amount: number;
  currency: 'PKR';
  method: (typeof PAY_METHODS)[number];
  provider: 'demo';
  reference: string;
  status: 'paid' | 'refunded';
  refundedAt?: Date;
};

const paymentSchema = new Schema<Payment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'PKR' },
    method: { type: String, enum: PAY_METHODS, required: true },
    provider: { type: String, enum: ['demo'], required: true },
    reference: { type: String, required: true, unique: true },
    status: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
    refundedAt: Date,
  },
  { timestamps: true, toJSON },
);
export const PaymentModel = model<Payment>('Payment', paymentSchema);

export const paymentsRouter = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id.');

// Customer pays for their own booking. Moves it to "assigning" for the partner, like a confirmed checkout.
paymentsRouter.post(
  '/bookings/:id/pay',
  requireAuth,
  requireRole('customer'),
  body(z.object({ method: z.enum(PAY_METHODS) })),
  async (req, res) => {
    const u = me(req);
    const { id } = parse(z.object({ id: objectId }), req.params);
    const b = await loadBooking(id, u);
    if (b.status !== 'pending_payment') throw new AppError(409, 'already_paid', 'This booking is already paid.');
    if (env.PAYMENT_PROVIDER !== 'demo') throw new AppError(503, 'payments_unavailable', 'Payments are not available right now.');

    const { method } = req.body as { method: Payment['method'] };
    const payment = await PaymentModel.create({
      booking: b._id,
      customer: u.id,
      amount: b.price.total,
      method,
      provider: 'demo',
      reference: `DEMO-${randomBytes(4).toString('hex').toUpperCase()}`,
    });

    const at = new Date();
    const by = new Types.ObjectId(u.id);
    b.paidAt = at;
    b.history.push({ status: 'paid', at, by, byRole: 'customer', note: `Demo payment ${payment.reference}` });
    b.history.push({ status: 'assigning', at, by, byRole: 'customer', note: 'Waiting for partner assignment' });
    b.status = 'assigning';
    await b.save();

    const customer = await UserModel.findById(u.id).select('name email').lean();
    if (customer?.email) {
      await sendEmail({
        to: customer.email,
        subject: `Receipt for booking ${b.code}`,
        heading: 'Payment received',
        lines: [
          `Booking ${b.code}: PKR ${b.price.total.toLocaleString('en-PK')} (includes PKR ${b.price.fee.toLocaleString('en-PK')} service fee).`,
          `Receipt ${payment.reference}${payment.provider === 'demo' ? ', demo payment: no money was charged' : ''}.`,
          'We are assigning your staff now and will update you in the app.',
        ],
      });
    }
    const admins = await UserModel.find({ role: 'admin', status: 'active' }).select('_id').lean();
    await notify(admins.map((a) => String(a._id)), {
      title: `Booking ${b.code} paid`,
      body: 'Assign it to a partner company.',
      link: { kind: 'booking', id: b.id },
    });
    res.status(201).json({ payment, booking: await broadcast(b) });
  },
);

paymentsRouter.get('/bookings/:id/payments', requireAuth, async (req, res) => {
  const { id } = parse(z.object({ id: objectId }), req.params);
  const b = await loadBooking(id, me(req));
  res.json({ items: await PaymentModel.find({ booking: b._id }).sort({ createdAt: -1 }) });
});

paymentsRouter.get('/me/payments', requireAuth, requireRole('customer'), async (req, res) => {
  const items = await PaymentModel.find({ customer: me(req).id }).sort({ createdAt: -1 }).limit(100).populate('booking', 'code service plan hours days contractMonths');
  res.json({ items });
});

// Called when a paid booking is cancelled. Demo payments are refunded at once.
export async function refundBooking(bookingId: string) {
  const payments = await PaymentModel.find({ booking: bookingId, status: 'paid' });
  for (const p of payments) {
    p.status = 'refunded';
    p.refundedAt = new Date();
    await p.save();
    await notify([refId(p.customer)], {
      title: 'Refund issued',
      body: `PKR ${p.amount.toLocaleString('en-PK')} for ${p.reference}${p.provider === 'demo' ? ' (demo, no money moved)' : ''}.`,
      tone: 'green',
      link: { kind: 'booking', id: bookingId },
    });
  }
  return payments.length;
}

