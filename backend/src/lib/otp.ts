import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import { env, isProd } from '@/config/env';

import { AppError, tooMany } from './errors';
import { kv } from './kv';
import { sendEmail } from './email';
import { sms } from './sms';

const CODE_TTL = 5 * 60;
const RESEND_COOLDOWN = 30;
const MAX_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

const digest = (phone: string, code: string) => createHmac('sha256', env.OTP_PEPPER).update(`${phone}:${code}`).digest();

const isTestPhone = (phone: string) => !isProd && env.OTP_TEST_PHONES.includes(phone);

// Codes are keyed by phone. With OTP_CHANNEL=email they are delivered to `email` instead of by SMS.
export async function sendOtp(phone: string, email?: string) {
  // Test numbers: no SMS, no limits; the fixed test code is accepted.
  if (isTestPhone(phone)) return { resendIn: RESEND_COOLDOWN, expiresIn: CODE_TTL, devCode: env.OTP_TEST_CODE };

  const cooldown = await kv.ttl(`otp:cd:${phone}`);
  if (cooldown > 0) throw tooMany(`Wait ${cooldown} seconds before requesting another code.`, cooldown);
  const sent = await kv.incr(`otp:hr:${phone}`, 3600);
  if (sent > MAX_PER_HOUR) throw tooMany('Too many codes requested. Try again in an hour.', 3600);

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await kv.set(`otp:${phone}`, digest(phone, code).toString('base64'), CODE_TTL);
  await kv.del(`otp:att:${phone}`);
  await kv.set(`otp:cd:${phone}`, '1', RESEND_COOLDOWN);
  try {
    if (env.OTP_CHANNEL === 'email') {
      if (!email) throw new AppError(400, 'email_required', 'Add an email address to receive your code.');
      await sendEmail({
        to: email,
        subject: `${code} is your My Captain code`,
        heading: 'Your sign-in code',
        lines: [`Enter ${code} in the My Captain app. It expires in 5 minutes.`, 'If you did not ask for this code, you can ignore this email. Never share it with anyone.'],
        throwOnError: true,
      });
    } else {
      await sms.send(phone, `${code} is your My Captain code. It expires in 5 minutes. Do not share it.`);
    }
  } catch (err) {
    // Nothing was delivered: let the person retry straight away.
    await Promise.all([kv.del(`otp:${phone}`), kv.del(`otp:cd:${phone}`)]);
    throw err;
  }

  // Development and tests get the code back to speed up testing; never in production.
  return { resendIn: RESEND_COOLDOWN, expiresIn: CODE_TTL, ...(isProd ? {} : { devCode: code }) };
}

export async function checkOtp(phone: string, code: string) {
  if (isTestPhone(phone)) {
    if (code !== env.OTP_TEST_CODE) throw new AppError(400, 'otp_invalid', 'That code is not correct.');
    return;
  }
  const stored = await kv.get(`otp:${phone}`);
  if (!stored) throw new AppError(400, 'otp_expired', 'This code has expired. Request a new one.');

  const attempts = await kv.incr(`otp:att:${phone}`, CODE_TTL);
  if (attempts > MAX_ATTEMPTS) {
    await kv.del(`otp:${phone}`);
    throw tooMany('Too many wrong attempts. Request a new code.');
  }

  const a = Buffer.from(stored, 'base64');
  const b = digest(phone, code);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new AppError(400, 'otp_invalid', `That code is not correct. ${MAX_ATTEMPTS - attempts} attempts left.`);
  }
  await kv.del(`otp:${phone}`);
  await kv.del(`otp:att:${phone}`);
}
