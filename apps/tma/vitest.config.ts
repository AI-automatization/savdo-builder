/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// TMA-FRONTEND-TESTS-001 (API-FRONTEND-TESTS-001 part 2): vitest конфиг отдельный
// от vite.config.ts чтобы не тащить production proxy в тестовое окружение.
// jsdom + jest-dom матчеры; css: false — стили в smoke не нужны.
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
