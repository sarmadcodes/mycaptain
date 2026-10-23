import type { Types } from 'mongoose';

import { env, isTest } from '@/config/env';
import { BookingModel } from '@/models/booking';
import { CompanyModel } from '@/models/company';
import { UserModel } from '@/models/user';
import { broadcast } from '@/modules/bookings';
import { generatePayouts } from '@/modules/payouts';

import { kv } from './kv';
import { logger } from './logger';
import { notify } from './notify';

// Background jobs. Each run takes a short lock so only one server instance does the work.

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const PKT_OFFSET = 5 * 60 * MIN; // Pakistan time is UTC+5 all year.

async function once(name: string, ttlSec: number, fn: () => Promise<unknown>) {
  if ((await kv.incr(`job:${name}`, ttlSec)) !== 1) return;
  try {
    await fn();
  } catch (err) {
    logger.error({ err, job: name }, 'job failed');
  }
}

const adminIds = async () => (await UserModel.find({ role: 'admin', status: 'active' }).select('_id').lean()).map((u) => String(u._id));
const ownerIds = async (company: Types.ObjectId | undefined) =>
  (await UserModel.find({ company, role: 'partner', status: 'active' }).select('_id').lean()).map((u) => String(u._id));
const pk = (d: Date) => d.toLocaleString('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// 1. Unpaid bookings are cancelled after UNPAID_CANCEL_MINUTES, or once their start time passes.
export async function cancelUnpaid(now = new Date()) {
  const cutoff = new Date(now.getTime() - env.UNPAID_CANCEL_MINUTES * MIN);
  const stale = await BookingModel.find({ status: 'pending_payment', $or: [{ createdAt: { $lt: cutoff } }, { startAt: { $lt: now } }] }).limit(200);
  for (const b of stale) {
    b.status = 'cancelled';
    b.cancelReason = 'Not paid in time';
    b.history.push({ status: 'cancelled', at: now, byRole: 'admin', note: 'Cancelled automatically: payment not received' });
    await b.save();
    await notify([String(b.customer)], {
      title: `Booking ${b.code} cancelled`,
      body: 'It was not paid in time. Book again whenever you are ready.',
      tone: 'amber',
      link: { kind: 'booking', id: b.id },
    });
    await broadcast(b);
  }
  return stale.length;
}

// 2. Reminders an hour before a confirmed duty, to staff and customer, once per booking.
export async function remindUpcoming(now = new Date()) {
  const soon = await BookingModel.find({
    status: 'confirmed',
    startAt: { $gt: now, $lte: new Date(now.getTime() + 60 * MIN) },
    remindedAt: { $exists: false },
  }).limit(200);
  for (const b of soon) {
    // Claim first so a slow run never sends twice.
    const claimed = await BookingModel.updateOne({ _id: b._id, remindedAt: { $exists: false } }, { $set: { remindedAt: now } });
    if (!claimed.modifiedCount) continue;
    await notify(b.staff.map(String), {
      title: `Duty ${b.code} starts at ${pk(b.startAt)}`,
      body: `${b.location.address}. Tap "I am on my way" when you leave.`,
      tone: 'amber',
      link: { kind: 'booking', id: b.id },
    });
    await notify([String(b.customer)], {
      title: 'Your booking starts within the hour',
      body: `${b.code} at ${pk(b.startAt)}. You can message your staff in the app.`,
      link: { kind: 'booking', id: b.id },
    });
  }
  return soon.length;
}

// 3. Licence and document expiry: warns the company 30 days, 7 days and on the day; admins on expiry.
export async function warnExpiring(now = new Date()) {
  const horizon = new Date(now.getTime() + 30 * DAY);
  const daysLeft = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / DAY);
  const due = (d: number) => d === 30 || d === 7 || d <= 0;
  let sent = 0;

  const companies = await CompanyModel.find({ status: 'approved', 'securityLicence.expiry': { $lte: horizon } }).select('legalName tradingName securityLicence');
  for (const c of companies) {
    const left = daysLeft(c.securityLicence!.expiry!);
    if (!due(left)) continue;
    const name = c.tradingName || c.legalName;
    await notify(await ownerIds(c._id), {
      title: left <= 0 ? 'Security licence expired' : `Security licence expires in ${left} days`,
      body: `Upload the renewed licence on the partner website to keep receiving security bookings.`,
      tone: left <= 0 ? 'red' : 'amber',
    });
    if (left <= 0) await notify(await adminIds(), { title: `${name}: security licence expired`, body: 'Review the company before assigning security work.', tone: 'red' });
    sent++;
  }

  const staff = await UserModel.find({ role: { $in: ['driver', 'guard'] }, status: 'active', 'documents.expiresAt': { $lte: horizon } }).select('name company documents');
  for (const s of staff) {
    for (const d of s.documents) {
      if (!d.expiresAt) continue;
      const left = daysLeft(d.expiresAt);
      if (!due(left)) continue;
      const doc = d.kind.replace(/_/g, ' ');
      await notify(await ownerIds(s.company), {
        title: left <= 0 ? `${s.name}: ${doc} expired` : `${s.name}: ${doc} expires in ${left} days`,
        body: 'Upload the renewed document from the Staff page.',
        tone: left <= 0 ? 'red' : 'amber',
      });
      await notify([String(s._id)], {
        title: left <= 0 ? `Your ${doc} has expired` : `Your ${doc} expires in ${left} days`,
        body: 'Give the renewed copy to your company.',
        tone: left <= 0 ? 'red' : 'amber',
      });
      sent++;
    }
  }
  return sent;
}

// 4. Weekly payout statements, Monday to Monday in Pakistan time, created each Monday morning.
export async function weeklyPayouts(now = new Date()) {
  const local = new Date(now.getTime() + PKT_OFFSET);
  const daysSinceMonday = (local.getUTCDay() + 6) % 7;
  const mondayLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysSinceMonday);
  const to = new Date(mondayLocal - PKT_OFFSET);
  const from = new Date(to.getTime() - 7 * DAY);
  return (await generatePayouts(from, to)).length;
}

let timers: NodeJS.Timeout[] = [];

export function startJobs() {
  if (isTest || !env.JOBS_ENABLED) return;
  const every = (ms: number, name: string, ttl: number, fn: () => Promise<unknown>) => {
    const run = () => void once(name, ttl, fn);
    timers.push(setInterval(run, ms));
    setTimeout(run, 10_000).unref();
  };
  every(5 * MIN, 'cancel-unpaid', 4 * 60, cancelUnpaid);
  every(5 * MIN, 'remind-upcoming', 4 * 60, remindUpcoming);
  // Once a day: the lock key includes the date, so restarts do not resend.
  every(60 * MIN, 'expiry', 60, async () => once(`expiry:${new Date(Date.now() + PKT_OFFSET).toISOString().slice(0, 10)}`, 2 * 86_400, warnExpiring));
  every(60 * MIN, 'payouts', 60, async () => {
    const local = new Date(Date.now() + PKT_OFFSET);
    if (local.getUTCDay() !== 1 || local.getUTCHours() < 6) return; // Mondays after 6 AM
    await once(`payouts:${local.toISOString().slice(0, 10)}`, 2 * 86_400, weeklyPayouts);
  });
  logger.info('background jobs started');
}

export function stopJobs() {
  timers.forEach(clearInterval);
  timers = [];
}

