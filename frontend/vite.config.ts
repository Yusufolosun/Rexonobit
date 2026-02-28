import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk: React runtime
          vendor: ['react', 'react-dom'],
          // Stacks SDK chunk
          stacks: [
            '@stacks/connect',
            '@stacks/transactions',
            '@stacks/network',
          ],
        },
      },
    },
    // Warn when chunks exceed 400kB
    chunkSizeWarningLimit: 400,
  },
})
