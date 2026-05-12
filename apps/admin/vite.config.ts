import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { port: 3003 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            // React core — нужен сразу для login, не lazy.
            if (id.includes('react-router')) return 'vendor-react'
            if (id.includes('react-dom') || /node_modules[\\/]react[\\/]/.test(id)) return 'vendor-react'
            // UI libs — крупные, на login не нужны → отдельный chunk.
            if (id.includes('lucide-react')) return 'vendor-ui'
            if (id.includes('@radix-ui')) return 'vendor-ui'
            if (id.includes('sonner')) return 'vendor-ui'
            // Charts — тяжёлые, нужны только в Analytics.
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
            // QR / TOTP — нужны только в MfaSetupPage.
            if (id.includes('qrcode') || id.includes('otplib')) return 'vendor-mfa'
          }
          return undefined
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
