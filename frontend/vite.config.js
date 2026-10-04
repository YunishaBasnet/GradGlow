/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

  const proxy = {
    '/api': {
      target: backendUrl,
      changeOrigin: true,
    },
    '/health': {
      target: backendUrl,
      changeOrigin: true,
    },
  }

  return {
    plugins: [react()],
    server: {
      proxy,
    },
    preview: {
      proxy,
    },
  }
})
