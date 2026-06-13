import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    include: ['sql.js/dist/sql-wasm.js']
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/**/*', 'icons/logo.png', 'images/**/*', 'sql-wasm.wasm'],
      manifest: false,
      devOptions: {
        enabled: false
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff2,wasm}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws',
      clientPort: 5173
    }
  },
  preview: {
    host: true,
    port: 4173
  }
})
