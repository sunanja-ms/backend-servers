import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['app.kixuka.my.id', 'api.kixuka.my.id'],

    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.1.3:8080',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://192.168.1.3:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://192.168.1.3:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    allowedHosts: ['app.kixuka.my.id', 'api.kixuka.my.id'],
    strictPort: true,
    proxy: {
      '/api': { target: 'http://192.168.1.3:8080', changeOrigin: true },
      '/docs': { target: 'http://192.168.1.3:8080', changeOrigin: true },
      '/health': { target: 'http://192.168.1.3:8080', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
