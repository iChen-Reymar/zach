import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function supabaseProxy(env) {
  const target = env.VITE_SUPABASE_URL?.replace(/\/+$/, '')
  if (!target) return {}

  const proxyOptions = {
    target,
    changeOrigin: true,
    secure: false
  }

  return {
    '/auth': proxyOptions,
    '/rest': proxyOptions,
    '/storage': proxyOptions,
    '/realtime': { ...proxyOptions, ws: true }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Electron loads dist/index.html from disk (file://) — needs relative paths.
  // Vercel and other web hosts need absolute paths from site root.
  const base = mode === 'electron' ? './' : '/'

  return {
    base,
    assetsInclude: [],
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['icons/**/*', 'icons/logo.png'],
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
      proxy: supabaseProxy(env)
    },
    preview: {
      host: true,
      port: 4173,
      proxy: supabaseProxy(env)
    }
  }
})
