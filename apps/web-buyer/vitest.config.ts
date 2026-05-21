/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// FRONTEND-SMOKE-PLAYWRIGHT-001 (vitest часть, web-buyer): config отдельный
// от Next.js build pipeline. jsdom-env, alias `@` → ./src.
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
