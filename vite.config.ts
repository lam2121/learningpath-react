import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawBase = env.VITE_BASE_PATH || '/careerpath/'
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`

  return {
    base,
    plugins: [
      // Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      },
    },
    server: {
      port: Number(env.VITE_PORT) || 3000,
      proxy: {
        '/api': {
          target: env.VITE_DEV_BACKEND_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory')) {
              return 'vendor-charts'
            }
            if (id.includes('node_modules/@tanstack')) {
              return 'vendor-tanstack'
            }
            if (id.includes('node_modules/@radix-ui')) {
              return 'vendor-radix'
            }
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons')) {
              return 'vendor-icons'
            }
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
              return 'vendor-i18n'
            }
          },
        },
      },
    },
  }
})

