import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    host: '127.0.0.1', // Bind to localhost only for better performance
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        timeout: 30000, // Increase timeout
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        timeout: 30000, // Increase timeout
      },
    },
  },
  // Optimize build for better performance
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'react-router-dom'],
  },
})