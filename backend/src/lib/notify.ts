import type { Notification } from '@/models/ops';
import { NotificationModel } from '@/models/ops';

import { logger } from './logger';
import { emit } from './realtime';

export type NotifyInput = Pick<Notification, 'title' | 'body'> & Partial<Pick<Notification, 'tone' | 'link'>>;

type Sender = (userIds: string[], n: NotifyInput) => Promise<void>;
const senders: Sender[] = [];

// Extra delivery channels (push, email) register here so callers only call notify().
export function addSender(s: Sender) {
  senders.push(s);
}

// Stores the notification for each user, pushes it live, then fans out to other channels.
// Never throws: a failed notification must not fail the action that caused it.
export async function notify(userIds: (string | undefined | null)[], n: NotifyInput) {
  const ids = [...new Set(userIds.filter((x): x is string => !!x))];
  if (!ids.length) return;
  try {
    const docs = await NotificationModel.insertMany(ids.map((user) => ({ user, tone: 'blue', ...n })));
    for (const d of docs) emit('notification:new', d.toJSON(), { users: [String(d.user)] });
    await Promise.allSettled(senders.map((s) => s(ids, n)));
  } catch (err) {
    logger.error({ err }, 'notify failed');
  }
}
