import 'dotenv/config';
import { z } from 'zod';

import { normalizePkMobile } from '@/lib/phone';

const secret = z.string().min(32, 'must be at least 32 characters');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    // 127.0.0.1 on the VPS so only Nginx can reach the API.
    HOST: z.string().default('0.0.0.0'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:8081,http://localhost:3000')
      .transform((s) =>
        s
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
      ),
    MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/my-captain'),
    REDIS_URL: z.string().optional().transform((v) => v || undefined),

    JWT_ACCESS_SECRET: secret,
    JWT_REFRESH_SECRET: secret,
    OTP_PEPPER: secret,
    ACCESS_TOKEN_TTL: z.string().default('15m'),
    REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(30),

    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    SMS_PROVIDER: z.enum(['console', 'twilio', 'http']).default('console'),
    // Test numbers that skip SMS and accept OTP_TEST_CODE (development and testing only).
    OTP_TEST_PHONES: z
      .string()
      .default('')
      .transform((s) => s.split(',').map((p) => normalizePkMobile(p.trim())).filter((p): p is string => !!p)),
    OTP_TEST_CODE: z.string().regex(/^\d{6}$/, 'must be 6 digits').default('123456'),
    SMS_DAILY_LIMIT: z.coerce.number().int().positive().default(2000),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_FROM: z.string().optional(),
    TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
    SMS_HTTP_URL: z.url().optional(),
    SMS_HTTP_METHOD: z.enum(['GET', 'POST']).default('GET'),
    SMS_HTTP_BODY: z.string().optional(),
    SMS_HTTP_AUTH_HEADER: z.string().optional(),
    // Text the gateway's reply must contain to count as sent (some return 200 on failure).
    SMS_HTTP_SUCCESS: z.string().optional(),

    SEED_ADMIN_PHONE: z.string().optional(),
    SEED_ADMIN_PASSWORD: z.string().optional(),
  })
  .superRefine((e, ctx) => {
    const need = (keys: (keyof typeof e)[], why: string) =>
      keys.forEach((k) => !e[k] && ctx.addIssue({ code: 'custom', path: [k], message: why }));
    if (e.SMS_PROVIDER === 'twilio') {
      need(['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'], 'required for SMS_PROVIDER=twilio');
      if (!e.TWILIO_FROM && !e.TWILIO_MESSAGING_SERVICE_SID) need(['TWILIO_FROM'], 'set TWILIO_FROM or TWILIO_MESSAGING_SERVICE_SID');
    }
    if (e.SMS_PROVIDER === 'http') need(['SMS_HTTP_URL'], 'required for SMS_PROVIDER=http');
    if (e.NODE_ENV !== 'production') return;
    if (e.CORS_ORIGINS.some((o) => o.startsWith('http://'))) {
      ctx.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'use https origins in production' });
    }
    // Production refuses to boot with dev conveniences.
    if (!e.REDIS_URL) ctx.addIssue({ code: 'custom', path: ['REDIS_URL'], message: 'required in production' });
    for (const k of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const) {
      if (!e[k]) ctx.addIssue({ code: 'custom', path: [k], message: 'required in production' });
    }
    if (e.OTP_TEST_PHONES.length) {
      ctx.addIssue({ code: 'custom', path: ['OTP_TEST_PHONES'], message: 'test numbers that skip SMS are not allowed in production' });
    }
    if (e.SMS_PROVIDER === 'console') {
      ctx.addIssue({ code: 'custom', path: ['SMS_PROVIDER'], message: 'console SMS is not allowed in production' });
    }
  });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`Invalid environment configuration:\n${lines}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
