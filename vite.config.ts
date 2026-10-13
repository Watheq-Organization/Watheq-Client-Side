import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    proxy: {
      '/hubs': {
        target: 'https://whateq.runasp.net',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
      '/api': {
        target: 'https://whateq.runasp.net',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})