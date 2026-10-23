import path from 'node:path';

import { defineConfig } from 'vitest/config';

// Unit tests for the app's plain TypeScript logic (no React Native rendering).
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'node', include: ['test/**/*.test.ts'] },
});
