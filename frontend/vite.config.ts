import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files so we can supply safe defaults for define
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    // Supply compile-time constants (safe defaults when env var is absent)
    define: {
      __STACKS_NETWORK__: JSON.stringify(env.VITE_STACKS_NETWORK ?? 'testnet'),
      __APP_VERSION__: JSON.stringify(env.npm_package_version ?? '0.0.0'),
    },
    // Pre-bundle Stacks SDK packages to avoid re-optimisation on first load
    optimizeDeps: {
      include: [
        '@stacks/connect',
        '@stacks/transactions',
        '@stacks/network',
      ],
    },
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
  }
})
