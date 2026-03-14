import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules', '.vercel', 'dist'],
    testTimeout: 5000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['api/**/*.js'],
    },
    env: {
      NODE_ENV: 'test',
      BASE_URL: 'http://localhost:3000',
    },
  },
});
