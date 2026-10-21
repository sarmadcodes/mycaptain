import { afterEach, describe, expect, it, vi } from 'vitest';

// Each case loads sms.ts fresh with its own provider settings; fetch is faked so nothing is sent.
async function load(vars: Record<string, string>, reply: { status?: number; body?: string } = {}) {
  vi.resetModules();
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(reply.body ?? 'OK', { status: reply.status ?? 200 }));
  vi.stubGlobal('fetch', fetchMock);
  const { sms } = await import('@/lib/sms');
  return { sms, fetchMock };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('sms providers', () => {
  it('twilio posts to the Messages API with basic auth', async () => {
    const { sms, fetchMock } = await load({
      SMS_PROVIDER: 'twilio',
      TWILIO_ACCOUNT_SID: 'AC123',
      TWILIO_AUTH_TOKEN: 'secret',
      TWILIO_FROM: '+15550001111',
    });
    await sms.send('+923001234567', '123456 is your code');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json');
    expect((init.headers as Record<string, string>).authorization).toBe(`Basic ${Buffer.from('AC123:secret').toString('base64')}`);
    const body = new URLSearchParams(String(init.body));
    expect(body.get('To')).toBe('+923001234567');
    expect(body.get('From')).toBe('+15550001111');
  });

  it('http gateway fills the URL template with the local number and encoded text', async () => {
    const { sms, fetchMock } = await load({
      SMS_PROVIDER: 'http',
      SMS_HTTP_URL: 'https://gateway.example/send?key=k&to={to_local}&msg={text}',
    });
    await sms.send('+923001234567', 'code 12 & more');
    expect(fetchMock.mock.calls[0]![0]).toBe('https://gateway.example/send?key=k&to=03001234567&msg=code%2012%20%26%20more');
  });

  it('http gateway sends a JSON body when configured', async () => {
    const { sms, fetchMock } = await load({
      SMS_PROVIDER: 'http',
      SMS_HTTP_URL: 'https://gateway.example/api',
      SMS_HTTP_METHOD: 'POST',
      SMS_HTTP_BODY: '{"to":"{to}","message":"{text}"}',
    });
    await sms.send('+923001234567', 'say "hi"');
    const init = fetchMock.mock.calls[0]![1]!;
    expect(JSON.parse(String(init.body))).toEqual({ to: '+923001234567', message: 'say "hi"' });
  });

  it('treats a reply without the success marker as a failure', async () => {
    const { sms } = await load(
      { SMS_PROVIDER: 'http', SMS_HTTP_URL: 'https://gateway.example/s?to={to}', SMS_HTTP_SUCCESS: 'Message Sent' },
      { body: 'Invalid API key' },
    );
    await expect(sms.send('+923001234567', 'x')).rejects.toMatchObject({ status: 502, code: 'sms_failed' });
  });

  it('stops sending after the daily limit', async () => {
    const { sms } = await load({ SMS_PROVIDER: 'http', SMS_HTTP_URL: 'https://gateway.example/s?to={to}', SMS_DAILY_LIMIT: '2' });
    await sms.send('+923001234567', 'a');
    await sms.send('+923001234567', 'b');
    await expect(sms.send('+923001234567', 'c')).rejects.toMatchObject({ status: 503 });
  });
});
