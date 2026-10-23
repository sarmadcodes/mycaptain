import { Router } from 'express';
import { z } from 'zod';

import { me, requireAuth } from '@/middleware/auth';
import { authLimiter } from '@/middleware/rate-limit';
import { body } from '@/middleware/validate';
import { AppError, notFound, unauthorized } from '@/lib/errors';
import { checkOtp, sendOtp } from '@/lib/otp';
import { normalizePkMobile, pkMobile } from '@/lib/phone';
import { consumeRefresh, issueRefresh, revokeRefresh, signAccess } from '@/lib/tokens';
import { BookingModel } from '@/models/booking';
import { CompanyModel } from '@/models/company';
import { UserModel, type UserDoc } from '@/models/user';

export const authRouter = Router();

export async function issueSession(user: UserDoc) {
  const accessToken = signAccess({
    sub: String(user._id),
    role: user.role,
    company: user.company ? String(user.company) : undefined,
    tv: user.tokenVersion,
  });
  const refreshToken = await issueRefresh(String(user._id));
  return { accessToken, refreshToken, user: user.toJSON() };
}

// Customers: request a code. `purpose` decides whether the number must exist.
authRouter.post(
  '/otp/request',
  authLimiter,
  body(z.object({ phone: pkMobile, purpose: z.enum(['sign-in', 'sign-up']) })),
  async (req, res) => {
    const { phone, purpose } = req.body as { phone: string; purpose: 'sign-in' | 'sign-up' };
    const existing = await UserModel.findOne({ phone }).select('role status').lean();
    if (existing && existing.role !== 'customer') {
      throw new AppError(400, 'use_password', 'This number belongs to a staff account. Use staff sign in.');
    }
    if (purpose === 'sign-in' && !existing) throw new AppError(404, 'no_account', 'No account with this number. Create one first.');
    if (purpose === 'sign-up' && existing) throw new AppError(409, 'account_exists', 'An account with this number already exists. Sign in instead.');
    if (existing?.status === 'suspended') throw new AppError(403, 'suspended', 'This account is suspended. Contact support.');
    res.json(await sendOtp(phone));
  },
);

// Customers: verify the code. Creates the account on sign-up.
authRouter.post(
  '/otp/verify',
  authLimiter,
  body(
    z.object({
      phone: pkMobile,
      code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.'),
      name: z.string().trim().min(2).max(80).optional(),
      email: z.email().max(120).optional(),
    }),
  ),
  async (req, res) => {
    const { phone, code, name, email } = req.body as { phone: string; code: string; name?: string; email?: string };
    // Staff, partner and admin accounts never sign in with a code: they need their password.
    const existing = await UserModel.findOne({ phone }).select('role').lean();
    if (existing && existing.role !== 'customer') {
      throw new AppError(400, 'use_password', 'This number belongs to a staff account. Use staff sign in.');
    }
    await checkOtp(phone, code);
    let user = await UserModel.findOne({ phone });
    if (!user) {
      if (!name) throw new AppError(400, 'name_required', 'Enter your name to create an account.');
      user = await UserModel.create({ role: 'customer', name, phone, email });
    }
    if (user.status !== 'active') throw new AppError(403, 'suspended', 'This account is suspended. Contact support.');
    user.lastLoginAt = new Date();
    await user.save();
    res.status(201).json(await issueSession(user));
  },
);

// Staff, partners and admins: phone or email with password.
authRouter.post(
  '/login',
  authLimiter,
  body(z.object({ identifier: z.string().trim().min(3).max(120), password: z.string().min(1).max(200) })),
  async (req, res) => {
    const { identifier, password } = req.body as { identifier: string; password: string };
    const phone = normalizePkMobile(identifier);
    const user = await UserModel.findOne(phone ? { phone } : { email: identifier.toLowerCase() }).select('+passwordHash');
    // Same message and similar timing whether the account exists or not.
    const ok = user ? await user.checkPassword(password) : await new Promise<boolean>((r) => setTimeout(() => r(false), 150));
    if (!user || !ok || user.role === 'customer') throw unauthorized('Phone number or password is incorrect.');
    if (user.status !== 'active') throw new AppError(403, 'suspended', 'This account is suspended. Contact your company or support.');
    if (user.role === 'driver' || user.role === 'guard') {
      const company = await CompanyModel.findById(user.company).select('status').lean();
      if (company?.status !== 'approved') throw new AppError(403, 'company_inactive', 'Your company is not active on My Captain yet.');
    }
    user.lastLoginAt = new Date();
    await user.save();
    res.json(await issueSession(user));
  },
);

authRouter.post('/refresh', authLimiter, body(z.object({ refreshToken: z.string().min(20).max(200) })), async (req, res) => {
  const userId = await consumeRefresh((req.body as { refreshToken: string }).refreshToken);
  const user = await UserModel.findById(userId);
  if (!user || user.status !== 'active') throw unauthorized('Your session has ended. Sign in again.');
  res.json(await issueSession(user));
});

authRouter.post('/logout', body(z.object({ refreshToken: z.string().min(20).max(200) })), async (req, res) => {
  await revokeRefresh((req.body as { refreshToken: string }).refreshToken);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await UserModel.findById(me(req).id).populate('company', 'legalName tradingName status ref');
  if (!user) throw notFound('Account');
  res.json({ user });
});

authRouter.patch(
  '/me',
  requireAuth,
  body(
    z.object({
      name: z.string().trim().min(2).max(80).optional(),
      email: z.email().max(120).optional(),
      pushEnabled: z.boolean().optional(),
      // Staff only.
      available: z.boolean().optional(),
      availability: z
        .object({ days: z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])).max(7), shift: z.enum(['day', 'night', 'any']) })
        .optional(),
    }),
  ),
  async (req, res) => {
    const u = me(req);
    const v = req.body as Record<string, unknown>;
    if ((v.available !== undefined || v.availability) && u.role !== 'driver' && u.role !== 'guard') {
      throw new AppError(403, 'forbidden', 'Availability is for staff accounts.');
    }
    // Staff names are managed by their company.
    if (v.name && (u.role === 'driver' || u.role === 'guard')) delete v.name;
    const user = await UserModel.findByIdAndUpdate(u.id, { $set: v }, { returnDocument: 'after', runValidators: true });
    if (!user) throw notFound('Account');
    res.json({ user });
  },
);

// Customers delete their own account (Play Store requirement). Personal details are removed;
// anonymous booking and payment records stay for tax and dispute purposes.
authRouter.delete('/me', requireAuth, async (req, res) => {
  const u = me(req);
  if (u.role !== 'customer') throw new AppError(403, 'forbidden', 'Staff and partner accounts are closed by their company or by My Captain.');
  const active = await BookingModel.exists({ customer: u.id, status: { $in: ['paid', 'assigning', 'confirmed', 'arriving', 'on_duty'] } });
  if (active) throw new AppError(409, 'active_bookings', 'Finish or cancel your active bookings before deleting your account.');
  const user = await UserModel.findById(u.id);
  if (!user) throw notFound('Account');
  user.name = 'Deleted customer';
  user.phone = `deleted:${user.id}`;
  user.email = undefined;
  user.avatarUrl = undefined;
  user.status = 'suspended';
  user.tokenVersion += 1;
  await user.save();
  res.status(204).end();
});

// Forgot password (staff, partners, admins). A code goes to the account's phone by SMS.
// The reply is the same whether or not the account exists, so numbers cannot be probed.
authRouter.post(
  '/password/forgot',
  authLimiter,
  body(z.object({ identifier: z.string().trim().min(3).max(120) })),
  async (req, res) => {
    const { identifier } = req.body as { identifier: string };
    const phone = normalizePkMobile(identifier);
    const user = await UserModel.findOne(phone ? { phone } : { email: identifier.toLowerCase() }).select('role status phone').lean();
    let sentTo: string | undefined;
    if (user && user.role !== 'customer' && user.status === 'active') {
      const r = await sendOtp(user.phone);
      sentTo = user.phone;
      // Development convenience only (sendOtp never returns it in production).
      if ('devCode' in r) return res.json({ sent: true, phoneHint: maskPhone(sentTo), devCode: r.devCode });
    }
    res.json({ sent: true, ...(sentTo ? { phoneHint: maskPhone(sentTo) } : {}) });
  },
);

authRouter.post(
  '/password/reset',
  authLimiter,
  body(
    z.object({
      identifier: z.string().trim().min(3).max(120),
      code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.'),
      password: z.string().min(8, 'Use at least 8 characters.').max(200),
    }),
  ),
  async (req, res) => {
    const { identifier, code, password } = req.body as { identifier: string; code: string; password: string };
    const phone = normalizePkMobile(identifier);
    const user = await UserModel.findOne(phone ? { phone } : { email: identifier.toLowerCase() });
    if (!user || user.role === 'customer') throw new AppError(400, 'otp_expired', 'This code has expired. Request a new one.');
    await checkOtp(user.phone, code);
    await user.setPassword(password);
    // Sign out everywhere: whoever knew the old password loses access.
    user.tokenVersion += 1;
    await user.save();
    res.json({ reset: true });
  },
);

const maskPhone = (p: string) => `${p.slice(0, 5)}*****${p.slice(-2)}`;

// Password change signs out every other session by bumping tokenVersion.
authRouter.post(
  '/password',
  requireAuth,
  body(z.object({ current: z.string().min(1), next: z.string().min(8, 'Use at least 8 characters.').max(200) })),
  async (req, res) => {
    const { current, next } = req.body as { current: string; next: string };
    const user = await UserModel.findById(me(req).id).select('+passwordHash');
    if (!user || !(await user.checkPassword(current))) throw new AppError(400, 'wrong_password', 'Current password is incorrect.');
    await user.setPassword(next);
    user.tokenVersion += 1;
    await user.save();
    res.json(await issueSession(user));
  },
);
