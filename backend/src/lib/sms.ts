import { env, isProd } from '@/config/env';

import { AppError } from './errors';
import { kv } from './kv';
import { logger } from './logger';

export interface SmsProvider {
  send(to: string, text: string): Promise<void>;
}

const TIMEOUT_MS = 10_000;

// Development provider: prints the message. Blocked in production by env validation.
const consoleProvider: SmsProvider = {
  async send(to, text) {
    if (isProd) throw new Error('Console SMS used in production');
    logger.info({ to }, `[sms] ${text}`);
  },
};

const twilioProvider: SmsProvider = {
  async send(to, text) {
    const sid = env.TWILIO_ACCOUNT_SID!;
    const body = new URLSearchParams({ To: to, Body: text });
    if (env.TWILIO_MESSAGING_SERVICE_SID) body.set('MessagingServiceSid', env.TWILIO_MESSAGING_SERVICE_SID);
    else body.set('From', env.TWILIO_FROM!);
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${sid}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`twilio ${res.status}: ${(await res.text()).slice(0, 300)}`);
  },
};

// Generic HTTP gateway for Pakistani providers (Veevo Tech, SendPK, Eocean, ...).
// SMS_HTTP_URL and SMS_HTTP_BODY may contain {to} (+92...), {to_local} (03...) and {text}.
const httpProvider: SmsProvider = {
  async send(to, text) {
    const local = to.replace(/^\+92/, '0');
    const fill = (t: string, enc: (s: string) => string) =>
      t.replaceAll('{to}', enc(to)).replaceAll('{to_local}', enc(local)).replaceAll('{text}', enc(text));
    const json = env.SMS_HTTP_BODY?.trim().startsWith('{');
    const res = await fetch(fill(env.SMS_HTTP_URL!, encodeURIComponent), {
      method: env.SMS_HTTP_METHOD,
      headers: {
        ...(env.SMS_HTTP_BODY ? { 'content-type': json ? 'application/json' : 'application/x-www-form-urlencoded' } : {}),
        ...(env.SMS_HTTP_AUTH_HEADER ? { authorization: env.SMS_HTTP_AUTH_HEADER } : {}),
      },
      body: env.SMS_HTTP_BODY ? fill(env.SMS_HTTP_BODY, json ? (s) => JSON.stringify(s).slice(1, -1) : encodeURIComponent) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const reply = (await res.text()).slice(0, 300);
    // Some gateways answer 200 even on failure, so a success marker can be required.
    if (!res.ok || (env.SMS_HTTP_SUCCESS && !reply.includes(env.SMS_HTTP_SUCCESS))) throw new Error(`sms gateway ${res.status}: ${reply}`);
  },
};

const provider = { console: consoleProvider, twilio: twilioProvider, http: httpProvider }[env.SMS_PROVIDER];

// A global daily cap protects the SMS bill from bots requesting codes for many numbers.
export const sms: SmsProvider = {
  async send(to, text) {
    const today = new Date().toISOString().slice(0, 10);
    if ((await kv.incr(`sms:day:${today}`, 86_400)) > env.SMS_DAILY_LIMIT) {
      logger.error({ limit: env.SMS_DAILY_LIMIT }, 'daily SMS limit reached');
      throw new AppError(503, 'sms_unavailable', 'We cannot send codes right now. Please try again later.');
    }
    try {
      await provider.send(to, text);
    } catch (err) {
      logger.error({ err, provider: env.SMS_PROVIDER }, 'sms send failed');
      throw new AppError(502, 'sms_failed', 'We could not send the code. Check the number and try again.');
    }
  },
};
