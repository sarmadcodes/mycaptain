// Demo accounts and sample data for showing the app and the website.
// Run: DEMO_PASSWORD='...' DEMO_CUSTOMER_EMAIL='you@example.com' node dist/scripts/demo-seed.js
// Safe to run again: existing demo records are reused, sample bookings are only created once.
import { Types } from 'mongoose';

import { connectDb, disconnectDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { BookingModel, type BookingStatus } from '@/models/booking';
import { CompanyModel } from '@/models/company';
import { CaseModel, NotificationModel } from '@/models/ops';
import { currentRates } from '@/models/rate-card';
import { RentalCarModel } from '@/models/rental-car';
import { nextRef } from '@/models/shared';
import { UserModel, type Role } from '@/models/user';
import { quote, type QuoteInput } from '@/modules/pricing';

const password = process.env.DEMO_PASSWORD ?? '';
const customerEmail = (process.env.DEMO_CUSTOMER_EMAIL ?? '').trim().toLowerCase();
const H = 3600_000;

async function user(role: Role, name: string, phone: string, extra: Record<string, unknown> = {}) {
  let u = await UserModel.findOne({ phone });
  if (!u) u = new UserModel({ role, name, phone });
  Object.assign(u, { name, status: 'active', ...extra });
  if (role !== 'customer') await u.setPassword(password);
  await u.save();
  return u;
}

async function main() {
  if (password.length < 10) throw new Error('Set DEMO_PASSWORD to at least 10 characters.');
  if (!/^\S+@\S+\.\S+$/.test(customerEmail)) throw new Error('Set DEMO_CUSTOMER_EMAIL to an inbox you can open (customer codes go there).');
  await connectDb();
  const rates = await currentRates();

  // ---------- People and company ----------
  const admin = await user('admin', 'Demo Operations', '+923000000001', { email: 'admin@demo.mycaptain.pk' });

  const owner = await user('partner', 'Tariq Hussain', '+923000000002', { email: 'partner@demo.mycaptain.pk' });
  let company = await CompanyModel.findOne({ ntn: '9990001-1' });
  if (!company) {
    company = await CompanyModel.create({
      ref: await nextRef('company', 'MCP', 100000),
      legalName: 'Shield Force Security (Pvt) Ltd',
      tradingName: 'Shield Force (Demo)',
      companyType: 'private-limited',
      registrationNo: 'DEMO-0412',
      ntn: '9990001-1',
      yearEstablished: 2014,
      city: 'Karachi',
      address: 'Office 12, Shahrah-e-Faisal',
      services: ['drivers', 'guards', 'armed', 'teams', 'rentals'],
      cities: ['Karachi', 'Lahore', 'Islamabad'],
      driverCount: 20,
      guardCount: 60,
      securityLicence: { number: 'PSRA-KHI-0412', expiry: new Date(Date.now() + 300 * 24 * H) },
      contact: { name: owner.name, designation: 'Director', phone: owner.phone, email: owner.email! },
      owner: owner._id,
      // Demo documents: placeholders, not real files.
      documents: ['registration', 'ntn', 'security_licence'].map((kind) => ({
        kind,
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        publicId: 'sample',
        resourceType: 'image',
        status: 'verified',
        uploadedAt: new Date(),
      })),
      status: 'approved',
      approvedAt: new Date(),
    });
  }
  owner.company = company._id;
  await owner.save();

  const staff = async (staffKind: 'driver' | 'guard' | 'gunman', name: string, phone: string) =>
    user(staffKind === 'driver' ? 'driver' : 'guard', name, phone, { company: company!._id, staffKind, available: true });
  const driver = await staff('driver', 'Ahmed Raza', '+923000000011');
  const guard1 = await staff('guard', 'Bilal Khan', '+923000000012');
  const guard2 = await staff('guard', 'Usman Ali', '+923000000013');
  const gunman = await staff('gunman', 'Imran Shah', '+923000000014');

  // A second company still waiting for review, so the admin has something to approve.
  const pendingOwner = await user('partner', 'Sana Malik', '+923000000003', { email: 'pending@demo.mycaptain.pk' });
  if (!(await CompanyModel.exists({ ntn: '9990002-2' }))) {
    const pending = await CompanyModel.create({
      ref: await nextRef('company', 'MCP', 100000),
      legalName: 'Elite Drive Services',
      companyType: 'partnership',
      registrationNo: 'DEMO-0533',
      ntn: '9990002-2',
      yearEstablished: 2019,
      city: 'Lahore',
      address: '45 Main Boulevard, Gulberg',
      services: ['drivers'],
      cities: ['Lahore'],
      driverCount: 12,
      contact: { name: pendingOwner.name, designation: 'Manager', phone: pendingOwner.phone, email: pendingOwner.email! },
      owner: pendingOwner._id,
      status: 'pending',
    });
    pendingOwner.company = pending._id;
    await pendingOwner.save();
  }

  const customer = await user('customer', 'Ayesha Khan', '+923000000021', { email: customerEmail });

  for (const car of [
    { name: 'Toyota Corolla Altis', class: 'sedan', seats: 4, perDay: 9000 },
    { name: 'Toyota Fortuner', class: 'suv', seats: 6, perDay: 16000 },
  ] as const) {
    await RentalCarModel.updateOne(
      { company: company._id, name: car.name },
      { $setOnInsert: { ...car, company: company._id, transmission: 'automatic', active: true, features: 'AC, airport runs' } },
      { upsert: true },
    );
  }

  // ---------- Sample bookings (once) ----------
  if (!(await BookingModel.exists({ customer: customer._id }))) {
    const at = (h: number) => new Date(Date.now() + h * H);
    const make = async (
      q: QuoteInput,
      status: BookingStatus,
      opts: { start: Date; staff?: Types.ObjectId[]; address: string; vehicle?: object; extra?: object },
    ) => {
      const flow: BookingStatus[] = ['pending_payment', 'paid', 'assigning', 'confirmed', 'arriving', 'on_duty', 'completed'];
      const upto: BookingStatus[] = status === 'cancelled' ? ['pending_payment', 'cancelled'] : flow.slice(0, flow.indexOf(status) + 1);
      return BookingModel.create({
        code: await nextRef('booking', 'MC', 2047),
        customer: customer._id,
        service: q.service,
        plan: q.plan,
        hours: q.hours,
        days: q.days,
        personnel: q.personnel,
        startAt: opts.start,
        asap: false,
        vehicle: opts.vehicle,
        location: { address: opts.address },
        price: quote(q, rates),
        status,
        company: upto.includes('assigning') ? company!._id : undefined,
        staff: upto.includes('confirmed') ? (opts.staff ?? []) : [],
        paidAt: upto.includes('paid') ? new Date(opts.start.getTime() - 24 * H) : undefined,
        startedAt: upto.includes('on_duty') ? opts.start : undefined,
        completedAt: status === 'completed' ? new Date(opts.start.getTime() + (q.hours ?? 8) * H) : undefined,
        cancelReason: status === 'cancelled' ? 'Plans changed' : undefined,
        history: upto.map((s) => ({ status: s, at: opts.start, byRole: 'admin', note: 'Demo data' })),
        ...opts.extra,
      });
    };
    const vehicle = { class: 'suv', makeModel: 'Toyota Fortuner', transmission: 'automatic' };

    await make({ service: 'driver', plan: 'hourly', hours: 4, vehicleClass: 'suv', personnel: 1 }, 'completed', {
      start: at(-72),
      staff: [driver._id],
      address: 'DHA Phase 6, Karachi',
      vehicle,
      extra: { rating: { stars: 5, comment: 'On time and very professional.', at: at(-60) } },
    });
    await make({ service: 'guard', plan: 'daily', days: 1, personnel: 2 }, 'completed', {
      start: at(-48),
      staff: [guard1._id, guard2._id],
      address: 'Clifton Block 5, Karachi',
    });
    await make({ service: 'gunman', plan: 'hourly', hours: 8, personnel: 1 }, 'on_duty', {
      start: at(-2),
      staff: [gunman._id],
      address: 'Sea View Apartments, Clifton, Karachi',
      extra: {
        locations: [{ staff: gunman._id, lat: 24.8138, lng: 67.0299, accuracy: 15, at: new Date() }],
        events: [{ kind: 'check_in', by: gunman._id, at: at(-1), lat: 24.8138, lng: 67.0299 }],
      },
    });
    await make({ service: 'driver', plan: 'hourly', hours: 6, vehicleClass: 'sedan', personnel: 1 }, 'confirmed', {
      start: at(26),
      staff: [driver._id],
      address: 'Gulshan-e-Iqbal Block 13, Karachi',
      vehicle: { class: 'sedan', makeModel: 'Honda Civic', transmission: 'automatic' },
    });
    await make({ service: 'team', plan: 'daily', days: 1, personnel: 2 }, 'assigning', { start: at(50), address: 'Expo Centre, Karachi' });
    await make({ service: 'guard', plan: 'hourly', hours: 4, personnel: 1 }, 'pending_payment', { start: at(5), address: 'PECHS Block 2, Karachi' });

    const first = await BookingModel.findOne({ customer: customer._id, status: 'completed' }).sort({ startAt: 1 });
    await CaseModel.create({
      ref: await nextRef('case', 'MC-C', 100),
      type: 'complaint',
      booking: first?._id,
      openedBy: customer._id,
      openedByRole: 'customer',
      details: 'Category: Late arrival\nThe driver arrived 15 minutes late. Otherwise the service was good.',
      timeline: [{ at: new Date(), by: customer._id, text: 'Case opened', internal: false }],
    });
    await NotificationModel.insertMany([
      { user: customer._id, title: 'Duty started', body: 'Your armed gunman is now on duty.', tone: 'green' },
      { user: gunman._id, title: 'New duty', body: 'Sea View Apartments, Clifton.', tone: 'blue' },
      { user: admin._id, title: 'New complaint case', body: 'Driver arrived 15 minutes late.', tone: 'amber' },
    ]);
  }

  await disconnectDb();
  const line = (who: string, login: string, how: string) => `  ${who.padEnd(22)} ${login.padEnd(34)} ${how}`;
  // eslint-disable-next-line no-console
  console.log(
    [
      '',
      'Demo accounts (password = DEMO_PASSWORD unless noted):',
      line('Admin (app + /admin)', '3000000001 or admin@demo.mycaptain.pk', 'password'),
      line('Partner (website)', 'partner@demo.mycaptain.pk', 'password'),
      line('Pending partner', 'pending@demo.mycaptain.pk', 'password (shows review state)'),
      line('Driver (app, staff)', '3000000011', 'password'),
      line('Guard (app, staff)', '3000000012 / 3000000013', 'password'),
      line('Armed gunman (app)', '3000000014', 'password, has a live duty'),
      line('Customer (app)', `3000000021`, `email code sent to ${customerEmail}`),
      '',
    ].join('\n'),
  );
  // Shared app modules start timers (e.g. the in-memory store); exit explicitly.
  process.exit(0);
}

main().catch(async (err) => {
  logger.fatal({ err }, 'demo seed failed');
  await disconnectDb();
  process.exit(1);
});
