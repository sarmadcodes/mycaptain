import { env, isTest } from '@/config/env';
import { UserModel } from '@/models/user';

import { logger } from './logger';
import type { NotifyInput } from './notify';

// Push notifications through Expo's push service, which delivers to FCM (Android) and APNs (iOS).
// EXPO_ACCESS_TOKEN is optional; set it if "enhanced push security" is turned on in the Expo project.

const URL = 'https://exp.host/--/api/v2/push/send';
const isExpoToken = (t: string) => /^Expo(nent)?PushToken\[.+\]$/.test(t);

type Ticket = { status: 'ok' | 'error'; details?: { error?: string } };

export async function sendPush(userIds: string[], n: NotifyInput) {
  if (isTest || !env.PUSH_ENABLED) return;
  const users = await UserModel.find({ _id: { $in: userIds }, 'pushTokens.0': { $exists: true }, pushEnabled: { $ne: false } })
    .select('pushTokens')
    .lean();
  const tokens = users.flatMap((u) => (u.pushTokens ?? []).map((t) => t.token)).filter(isExpoToken);
  if (!tokens.length) return;

  const messages = tokens.map((to) => ({
    to,
    title: n.title,
    body: n.body,
    sound: 'default',
    // Emergencies use the high-priority Android channel created by the app.
    channelId: n.tone === 'red' ? 'urgent' : 'default',
    priority: n.tone === 'red' ? 'high' : 'default',
    data: n.link ? { link: n.link } : {},
  }));

  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      const res = await fetch(URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...(env.EXPO_ACCESS_TOKEN ? { authorization: `Bearer ${env.EXPO_ACCESS_TOKEN}` } : {}),
        },
        body: JSON.stringify(batch),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        logger.warn({ status: res.status }, 'push send failed');
        continue;
      }
      const { data } = (await res.json()) as { data: Ticket[] };
      // Forget tokens for uninstalled apps so we stop sending to them.
      const dead = batch.filter((_, j) => data[j]?.details?.error === 'DeviceNotRegistered').map((m) => m.to);
      if (dead.length) await UserModel.updateMany({}, { $pull: { pushTokens: { token: { $in: dead } } } });
    } catch (err) {
      logger.warn({ err }, 'push send failed');
    }
  }
}
