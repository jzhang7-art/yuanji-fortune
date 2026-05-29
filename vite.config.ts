import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'generateSW',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'r3f'
            if (id.includes('framer-motion')) return 'motion'
            if (id.includes('lunar-typescript')) return 'lunar'
            if (id.includes('react-router')) return 'router'
            if (id.includes('html-to-image')) return 'share'
            if (id.includes('posthog-js')) return 'analytics'
            if (id.includes('react-dom') || id.includes('react/')) return 'react'
          }
          if (id.includes('/src/domain/')) return 'domain'
        },
      },
    },
  },
})
