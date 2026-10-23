import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Next's server-only guard throws outside a server component; tests import those modules directly.
      'server-only': path.resolve(__dirname, 'test/empty.ts'),
    },
  },
  test: { environment: 'node', include: ['test/**/*.test.ts'] },
});
