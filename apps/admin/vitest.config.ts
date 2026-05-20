/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// API-FRONTEND-TESTS-001: vitest конфиг отдельный от vite.config.ts чтобы не
// тащить тяжёлый production build pipeline (tailwind plugin, manualChunks)
// в тестовое окружение. tailwind в jsdom не нужен — мы не рендерим стили.
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
})
