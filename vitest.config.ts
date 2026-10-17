import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // The same `@/` alias tsconfig.json declares for the app.
    alias: { '@': path.join(import.meta.dirname, 'src') },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
