import { env, isProd, isTest } from '@/config/env';

import { AppError } from './errors';
import { logger } from './logger';

// Messages "sent" during tests, for assertions.
export const sent: { to: string; subject: string }[] = [];

// Transactional email. EMAIL_PROVIDER=console logs messages (development); resend sends through Resend.
// Sending never throws: a failed email must not fail the action that triggered it.

type Email = { to: string; subject: string; heading: string; lines: string[]; cta?: { label: string; url: string }; throwOnError?: boolean };

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function html(e: Email) {
  const body = e.lines.map((l) => `<p style="margin:0 0 14px;font-size:15px;line-height:22px;color:#33415c">${escape(l)}</p>`).join('');
  const cta = e.cta
    ? `<p style="margin:24px 0"><a href="${escape(e.cta.url)}" style="background:#2f6bff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:15px">${escape(e.cta.label)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;padding:32px">
<tr><td><p style="margin:0 0 24px;font-weight:700;font-size:18px;color:#101c30">My Captain</p>
<h1 style="margin:0 0 16px;font-size:22px;color:#101c30">${escape(e.heading)}</h1>${body}${cta}
<p style="margin:24px 0 0;font-size:12px;color:#8a94a6">My Captain, Pakistan. You get this email because of activity on your account.</p>
</td></tr></table></td></tr></table></body></html>`;
}

const text = (e: Email) => [e.heading, '', ...e.lines, ...(e.cta ? ['', `${e.cta.label}: ${e.cta.url}`] : [])].join('\n');

export async function sendEmail(e: Email) {
  if (!e.to) return;
  if (isTest) return void sent.push(e);
  try {
    if (env.EMAIL_PROVIDER === 'console') {
      if (isProd) throw new Error('Console email used in production');
      logger.info({ to: e.to, subject: e.subject }, `[email]\n${text(e)}`);
      return;
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [e.to], subject: e.subject, html: html(e), text: text(e) }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  } catch (err) {
    logger.error({ err }, 'email send failed');
    if (e.throwOnError) throw new AppError(502, 'email_failed', 'We could not send the email. Check the address and try again.');
  }
}

export const partnerUrl = (path = '') => `${env.PARTNER_SITE_URL}${path}`;
