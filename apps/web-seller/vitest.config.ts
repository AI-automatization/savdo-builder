/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// FRONTEND-SMOKE-PLAYWRIGHT-001 part B (vitest, web-seller): зеркалит web-buyer.
// jsdom-env, alias `@` → ./src, конфиг отдельный от Next.js build pipeline.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
