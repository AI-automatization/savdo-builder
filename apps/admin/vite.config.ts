import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { port: 3003 },
  build: {
    // ADMIN-VENDOR-CHUNK-CRASH-001 (14.07.2026): ручной manualChunks-сплит
    // (vendor-react/ui/charts/mfa) ломал init-порядок чанков после регенерации
    // lockfile (pnpm 11) — vendor-ui исполнялся до React → «Cannot read
    // properties of undefined (reading 'forwardRef')», чёрный экран ВСЕЙ
    // админки в проде. Дефолтный чанкинг Vite корректно упорядочивает
    // инициализацию; admin — внутренняя панель, размер бандла не критичен.
    // НЕ возвращать manualChunks без проверки `vite preview` в браузере.
    chunkSizeWarningLimit: 1500,
  },
})
