import { createServer } from 'node:http';

// First, so errors anywhere during start-up are reported.
import { captureError, flushMonitoring } from './lib/monitoring';

import { createApp } from './app';
import { env } from './config/env';
import { connectDb, disconnectDb } from './lib/db';
import { redis } from './lib/kv';
import { logger } from './lib/logger';
import { startJobs, stopJobs } from './lib/jobs';
import { attachRealtime, closeRealtime } from './lib/realtime';

async function main() {
  // Other modules (e.g. the rate limiter) may already have started the connection; just wait for it.
  const r = redis;
  if (r?.status === 'wait') await r.connect();
  else if (r && r.status !== 'ready') {
    await new Promise<void>((ok, fail) => {
      r.once('ready', ok);
      r.once('end', () => fail(new Error('Redis connection closed')));
    });
  }
  await connectDb();

  const server = createServer(createApp());
  attachRealtime(server);
  startJobs();
  server.listen(env.PORT, env.HOST, () => logger.info(`api listening on ${env.HOST}:${env.PORT}`));

  // Graceful shutdown: stop accepting, finish in-flight requests, close connections.
  let closing = false;
  const shutdown = async (signal: string) => {
    if (closing) return;
    closing = true;
    logger.info(`${signal} received, shutting down`);
    const force = setTimeout(() => process.exit(1), 10_000).unref();
    stopJobs();
    server.close();
    await closeRealtime();
    await disconnectDb();
    await redis?.quit();
    clearTimeout(force);
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    logger.error({ err }, 'unhandled rejection');
    captureError(err);
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'failed to start');
  captureError(err);
  flushMonitoring().finally(() => process.exit(1));
});
