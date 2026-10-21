import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { signedUrl } from '@/lib/cloudinary';
import { AppError, badRequest, forbidden, notFound } from '@/lib/errors';
import { notify } from '@/lib/notify';
import { emit } from '@/lib/realtime';
import { me, requireAuth, requireRole, type AuthUser } from '@/middleware/auth';
import { singleFile } from '@/middleware/upload';
import { body, parse } from '@/middleware/validate';
import { BookingModel, DUTY_EVENTS, type BookingDoc, type BookingStatus } from '@/models/booking';
import { CASE_STATUS, CASE_TYPES, CaseModel, MessageModel, NotificationModel, SosModel, type CaseDoc } from '@/models/ops';
import { nextRef } from '@/models/shared';
import { CompanyModel } from '@/models/company';
import { UserModel } from '@/models/user';

import { broadcast, loadBooking, refId } from './bookings';
import { storeUpload, toFileRef } from './uploads';

export const opsRouter = Router();

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id.');
const idParam = (req: { params: unknown }) => parse(z.object({ id: objectId }), req.params).id;
const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);

const isStaff = (u: AuthUser) => u.role === 'driver' || u.role === 'guard';

// Partner owners of a company, for notifications.
async function partnerIds(company?: unknown) {
  if (!company) return [];
  const users = await UserModel.find({ company: refId(company), role: 'partner', status: 'active' }).select('_id').lean();
  return users.map((x) => String(x._id));
}
async function adminIds() {
  const users = await UserModel.find({ role: 'admin', status: 'active' }).select('_id').lean();
  return users.map((x) => String(x._id));
}

// Everyone on a booking except the sender.
function bookingParties(b: BookingDoc, except?: string) {
  return [refId(b.customer), ...b.staff.map(refId)].filter((x) => x !== except);
}

// ---------- Chat ----------

// Chat opens once staff are assigned and stays readable afterwards; new messages only while active.
const CHAT_OPEN = ['confirmed', 'arriving', 'on_duty', 'completed'];

opsRouter.get('/bookings/:id/messages', requireAuth, async (req, res) => {
  const b = await loadBooking(idParam(req), me(req));
  const q = parse(z.object({ before: z.coerce.date().optional() }), req.query);
  const messages = await MessageModel.find({ booking: b._id, ...(q.before ? { createdAt: { $lt: q.before } } : {}) })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('from', 'name role')
    .lean({ virtuals: true });
  res.json({ messages: messages.reverse().map(({ _id, ...m }) => ({ id: String(_id), ...m })) });
});

opsRouter.post('/bookings/:id/messages', requireAuth, body(z.object({ text: z.string().trim().min(1).max(1000) })), async (req, res) => {
  const u = me(req);
  const b = await loadBooking(idParam(req), u);
  if (u.role === 'partner') throw forbidden('Partners follow the booking but do not join the chat.');
  if (!CHAT_OPEN.includes(b.status) || b.status === 'completed') throw badRequest('Chat is available while the booking is active.');
  const m = await MessageModel.create({ booking: b._id, from: u.id, fromRole: u.role, text: (req.body as { text: string }).text });
  await m.populate('from', 'name role');
  const payload = m.toJSON();
  emit('message:new', payload, { booking: b.id, users: bookingParties(b) });
  const sender = await UserModel.findById(u.id).select('name').lean();
  await notify(bookingParties(b, u.id), {
    title: `Message from ${sender?.name ?? 'My Captain'}`,
    body: m.text.slice(0, 140),
    link: { kind: 'booking', id: b.id },
  });
  res.status(201).json({ message: payload });
});

// ---------- Duty: check-ins, breaks, live location ----------

opsRouter.post(
  '/bookings/:id/events',
  requireAuth,
  requireRole('driver', 'guard'),
  body(z.object({ kind: z.enum(DUTY_EVENTS).exclude(['sos']), lat: lat.optional(), lng: lng.optional(), note: z.string().trim().max(300).optional() })),
  async (req, res) => {
    const u = me(req);
    const b = await loadBooking(idParam(req), u);
    if (b.status !== 'on_duty') throw badRequest('Check-ins and breaks are recorded while on duty.');
    const v = req.body as { kind: 'check_in' | 'break_start' | 'break_end'; lat?: number; lng?: number; note?: string };
    const mine = b.events.filter((e) => String(e.by) === u.id && (e.kind === 'break_start' || e.kind === 'break_end'));
    const onBreak = mine.at(-1)?.kind === 'break_start';
    if (v.kind === 'break_start' && onBreak) throw badRequest('You are already on a break.');
    if (v.kind === 'break_end' && !onBreak) throw badRequest('You are not on a break.');
    b.events.push({ ...v, by: new Types.ObjectId(u.id), at: new Date() });
    await b.save();
    if (v.kind !== 'check_in') {
      await notify([refId(b.customer)], {
        title: v.kind === 'break_start' ? 'Your guard is on a short break' : 'Break over',
        body: v.kind === 'break_start' ? 'They will be back shortly.' : 'Your guard is back on duty.',
        tone: 'amber',
        link: { kind: 'booking', id: b.id },
      });
    }
    res.status(201).json({ booking: await broadcast(b) });
  },
);

// Staff phones post their position every ~20 s while arriving or on duty.
opsRouter.post(
  '/bookings/:id/location',
  requireAuth,
  requireRole('driver', 'guard'),
  body(z.object({ lat, lng, accuracy: z.number().min(0).max(10_000).optional(), heading: z.number().min(0).max(360).optional() })),
  async (req, res) => {
    const u = me(req);
    const id = idParam(req);
    const v = req.body as { lat: number; lng: number; accuracy?: number; heading?: number };
    const at = new Date();
    const staff = new Types.ObjectId(u.id);
    // Atomic replace of this staff member's entry, only while the booking is live.
    const filter = { _id: id, staff, status: { $in: ['arriving', 'on_duty'] as BookingStatus[] } };
    const r = await BookingModel.updateOne(filter, { $pull: { locations: { staff } } });
    if (!r.matchedCount) throw new AppError(409, 'not_live', 'Location is shared only while arriving or on duty.');
    await BookingModel.updateOne(filter, { $push: { locations: { staff, ...v, at } } });
    emit('location', { booking: id, staff: u.id, ...v, at }, { booking: id });
    res.status(204).end();
  },
);

// ---------- SOS ----------

opsRouter.post(
  '/sos',
  requireAuth,
  requireRole('customer', 'driver', 'guard'),
  body(z.object({ bookingId: objectId.optional(), lat: lat.optional(), lng: lng.optional(), note: z.string().trim().max(300).optional() })),
  async (req, res) => {
    const u = me(req);
    const v = req.body as { bookingId?: string; lat?: number; lng?: number; note?: string };
    const b = v.bookingId ? await loadBooking(v.bookingId, u) : null;
    const user = await UserModel.findById(u.id).select('name phone company').lean();
    const sos = await SosModel.create({
      raisedBy: u.id,
      raisedByRole: u.role,
      booking: b?._id,
      company: b?.company ? refId(b.company) : user?.company,
      lat: v.lat,
      lng: v.lng,
      note: v.note,
    });
    if (b && isStaff(u)) {
      b.events.push({ kind: 'sos', by: new Types.ObjectId(u.id), at: new Date(), lat: v.lat, lng: v.lng, note: v.note });
      await b.save();
    }
    const payload = { ...sos.toJSON(), raisedByName: user?.name, raisedByPhone: user?.phone, bookingCode: b?.code };
    emit('sos:new', payload, { admins: true, companies: sos.company ? [String(sos.company)] : [] });
    await notify([...(await adminIds()), ...(await partnerIds(sos.company))], {
      title: `SOS from ${user?.name ?? 'a user'}${b ? ` (${b.code})` : ''}`,
      body: v.note || 'Emergency alert raised. Respond immediately.',
      tone: 'red',
      link: { kind: 'sos', id: sos.id },
    });
    res.status(201).json({ sos: payload });
  },
);

opsRouter.get('/sos', requireAuth, requireRole('admin', 'partner'), async (req, res) => {
  const u = me(req);
  const q = parse(z.object({ status: z.enum(['open', 'acknowledged', 'resolved']).optional() }), req.query);
  const items = await SosModel.find({ ...(u.role === 'partner' ? { company: u.company } : {}), ...(q.status ? { status: q.status } : {}) })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('raisedBy', 'name phone role')
    .populate('booking', 'code location');
  res.json({ items });
});

opsRouter.post(
  '/sos/:id/status',
  requireAuth,
  requireRole('admin'),
  body(z.object({ status: z.enum(['acknowledged', 'resolved']) })),
  async (req, res) => {
    const sos = await SosModel.findById(idParam(req));
    if (!sos) throw notFound('Alert');
    const { status } = req.body as { status: 'acknowledged' | 'resolved' };
    sos.status = status;
    if (status === 'acknowledged') {
      sos.acknowledgedBy = new Types.ObjectId(me(req).id);
      sos.acknowledgedAt = new Date();
    } else sos.resolvedAt = new Date();
    await sos.save();
    emit('sos:updated', sos.toJSON(), { admins: true, companies: sos.company ? [String(sos.company)] : [] });
    await notify([String(sos.raisedBy)], {
      title: status === 'acknowledged' ? 'Help is on the way' : 'Alert closed',
      body: status === 'acknowledged' ? 'My Captain support has seen your alert and is responding.' : 'Your emergency alert has been resolved.',
      tone: status === 'acknowledged' ? 'amber' : 'green',
      link: { kind: 'sos', id: sos.id },
    });
    res.json({ sos });
  },
);

// ---------- Ratings ----------

opsRouter.post(
  '/bookings/:id/rating',
  requireAuth,
  requireRole('customer'),
  body(z.object({ stars: z.number().int().min(1).max(5), comment: z.string().trim().max(500).optional() })),
  async (req, res) => {
    const b = await loadBooking(idParam(req), me(req));
    if (b.status !== 'completed' && b.status !== 'closed') throw badRequest('You can rate a booking once it is completed.');
    if (b.rating?.stars) throw new AppError(409, 'already_rated', 'You have already rated this booking.');
    const v = req.body as { stars: number; comment?: string };
    b.rating = { ...v, at: new Date() };
    await b.save();
    await notify(b.staff.map(refId), { title: `New ${v.stars}-star rating`, body: v.comment || `For booking ${b.code}.`, tone: 'green' });
    res.json({ booking: await broadcast(b) });
  },
);

// ---------- Cases ----------

function caseView(c: CaseDoc, u: AuthUser) {
  const j = c.toJSON() as ReturnType<CaseDoc['toJSON']> & { timeline: { internal: boolean }[]; evidence: { publicId: string; resourceType: string; url?: string }[] };
  if (u.role !== 'admin') j.timeline = j.timeline.filter((t) => !t.internal);
  j.evidence = j.evidence.map((e) => ({ ...e, url: signedUrl(e.publicId, e.resourceType) }));
  return j;
}

async function loadCase(id: string, u: AuthUser) {
  const c = await CaseModel.findById(id);
  if (!c || (u.role !== 'admin' && String(c.openedBy) !== u.id)) throw notFound('Case');
  return c;
}

opsRouter.post(
  '/cases',
  requireAuth,
  requireRole('customer', 'driver', 'guard'),
  body(
    z.object({
      type: z.enum(CASE_TYPES),
      bookingId: objectId.optional(),
      details: z.string().trim().min(10, 'Describe what happened in a few words.').max(2000),
      urgent: z.boolean().default(false),
    }),
  ),
  async (req, res) => {
    const u = me(req);
    const v = req.body as { type: (typeof CASE_TYPES)[number]; bookingId?: string; details: string; urgent: boolean };
    const b = v.bookingId ? await loadBooking(v.bookingId, u) : null;
    const c = await CaseModel.create({
      ref: await nextRef('case', 'MC-C', 100),
      type: v.type,
      booking: b?._id,
      openedBy: u.id,
      openedByRole: u.role,
      details: v.details,
      urgent: v.urgent || v.type === 'accident',
      timeline: [{ at: new Date(), by: u.id, text: 'Case opened', internal: false }],
    });
    emit('case:new', c.toJSON(), { admins: true });
    await notify(await adminIds(), {
      title: `${c.urgent ? 'Urgent: ' : ''}new ${v.type} case ${c.ref}`,
      body: v.details.slice(0, 140),
      tone: c.urgent ? 'red' : 'amber',
      link: { kind: 'case', id: c.id },
    });
    res.status(201).json({ case: caseView(c, u) });
  },
);

opsRouter.get('/cases', requireAuth, async (req, res) => {
  const u = me(req);
  const q = parse(z.object({ status: z.enum(CASE_STATUS).optional() }), req.query);
  const filter = { ...(u.role === 'admin' ? {} : { openedBy: u.id }), ...(q.status ? { status: q.status } : {}) };
  const items = await CaseModel.find(filter)
    .sort({ urgent: -1, createdAt: -1 })
    .limit(100)
    .populate('booking', 'code')
    .populate('openedBy', 'name role');
  res.json({ items: items.map((c) => caseView(c, u)) });
});

opsRouter.get('/cases/:id', requireAuth, async (req, res) => {
  const u = me(req);
  const c = await loadCase(idParam(req), u);
  await c.populate([
    { path: 'booking', select: 'code service staff customer', populate: [{ path: 'staff', select: 'name' }, { path: 'customer', select: 'name' }] },
    { path: 'openedBy', select: 'name role phone' },
  ]);
  res.json({ case: caseView(c, u) });
});

opsRouter.post('/cases/:id/evidence', requireAuth, singleFile, async (req, res) => {
  const u = me(req);
  const c = await loadCase(idParam(req), u);
  if (c.evidence.length >= 10) throw badRequest('Up to 10 files per case.');
  const stored = await storeUpload(req, `cases/${c.id}`, true);
  c.evidence.push(toFileRef('evidence', stored));
  c.timeline.push({ at: new Date(), by: new Types.ObjectId(u.id), text: 'Evidence added', internal: false });
  await c.save();
  res.status(201).json({ case: caseView(c, u) });
});

// Admin updates: status, a public reply, or an internal note.
opsRouter.patch(
  '/cases/:id',
  requireAuth,
  requireRole('admin'),
  body(
    z.object({
      status: z.enum(CASE_STATUS).optional(),
      reply: z.string().trim().min(2).max(1000).optional(),
      note: z.string().trim().min(2).max(1000).optional(),
      resolution: z.string().trim().min(2).max(1000).optional(),
    }),
  ),
  async (req, res) => {
    const u = me(req);
    const c = await loadCase(idParam(req), u);
    const v = req.body as { status?: (typeof CASE_STATUS)[number]; reply?: string; note?: string; resolution?: string };
    if (v.status === 'resolved' && !v.resolution && !c.resolution) throw badRequest('Add a resolution before closing the case.');
    const by = new Types.ObjectId(u.id);
    if (v.note) c.timeline.push({ at: new Date(), by, text: v.note, internal: true });
    if (v.reply) c.timeline.push({ at: new Date(), by, text: v.reply, internal: false });
    if (v.resolution) c.resolution = v.resolution;
    if (v.status && v.status !== c.status) {
      c.status = v.status;
      if (v.status === 'resolved') c.resolvedAt = new Date();
      c.timeline.push({ at: new Date(), by, text: v.status === 'resolved' ? `Resolved: ${c.resolution}` : 'Being handled by support', internal: false });
    }
    await c.save();
    if (v.reply || v.status) {
      await notify([String(c.openedBy)], {
        title: `Update on case ${c.ref}`,
        body: v.reply ?? (c.status === 'resolved' ? `Resolved: ${c.resolution}` : 'Support is handling your case.'),
        tone: c.status === 'resolved' ? 'green' : 'blue',
        link: { kind: 'case', id: c.id },
      });
    }
    res.json({ case: caseView(c, u) });
  },
);

// ---------- Me: company, notifications and staff earnings ----------

// The staff member's own company, with the contact who supervises them.
opsRouter.get('/me/company', requireAuth, requireRole('driver', 'guard'), async (req, res) => {
  const c = await CompanyModel.findById(me(req).company).select('legalName tradingName ref city address status securityLicence contact').lean();
  if (!c) throw notFound('Company');
  res.json({
    company: {
      name: c.tradingName || c.legalName,
      ref: c.ref,
      verified: c.status === 'approved',
      office: `${c.address}, ${c.city}`,
      licence: c.securityLicence?.number,
      supervisor: { name: c.contact.name, phone: c.contact.phone },
    },
  });
});

opsRouter.get('/me/notifications', requireAuth, async (req, res) => {
  const items = await NotificationModel.find({ user: me(req).id }).sort({ createdAt: -1 }).limit(50);
  const unread = await NotificationModel.countDocuments({ user: me(req).id, readAt: { $exists: false } });
  res.json({ items, unread });
});

opsRouter.post('/me/notifications/read', requireAuth, body(z.object({ ids: z.array(objectId).max(100).optional() })), async (req, res) => {
  const { ids } = req.body as { ids?: string[] };
  await NotificationModel.updateMany({ user: me(req).id, readAt: { $exists: false }, ...(ids ? { _id: { $in: ids } } : {}) }, { $set: { readAt: new Date() } });
  res.status(204).end();
});

// Value of completed duties, shared equally among the staff on each booking.
// Staff are paid by their company; this is the work they delivered, not a payslip.
opsRouter.get('/me/earnings', requireAuth, requireRole('driver', 'guard'), async (req, res) => {
  const u = me(req);
  const q = parse(z.object({ days: z.coerce.number().int().min(1).max(366).default(7) }), req.query);
  const since = new Date(Date.now() - q.days * 86_400_000);
  const done = await BookingModel.find({ staff: u.id, status: { $in: ['completed', 'closed'] }, completedAt: { $gte: since } })
    .sort({ completedAt: -1 })
    .select('code service plan hours days location price staff startedAt completedAt rating')
    .lean();
  const recent = done.map((b) => {
    const hours = b.startedAt && b.completedAt ? (+b.completedAt - +b.startedAt) / 3_600_000 : (b.price?.billableHours ?? 0);
    return {
      id: String(b._id),
      code: b.code,
      service: b.service,
      address: b.location.address,
      completedAt: b.completedAt,
      hours: Math.round(hours * 10) / 10,
      amount: Math.round((b.price?.subtotal ?? 0) / Math.max(1, b.staff.length)),
      stars: b.rating?.stars,
    };
  });
  const rated = recent.filter((r) => r.stars);
  res.json({
    days: q.days,
    total: recent.reduce((a, r) => a + r.amount, 0),
    duties: recent.length,
    hours: Math.round(recent.reduce((a, r) => a + r.hours, 0) * 10) / 10,
    rating: rated.length ? Math.round((rated.reduce((a, r) => a + r.stars!, 0) / rated.length) * 10) / 10 : null,
    recent,
  });
});

