import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tools/firestore-rules/**/*.spec.ts'],
    fileParallelism: false,
    hookTimeout: 15_000,
    testTimeout: 15_000,
  },
});
