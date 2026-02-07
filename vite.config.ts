import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'

export default defineConfig({
  base: '/storyworthy/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      includeAssets: ['icons/*.svg'],
      manifest: {
        name: 'Storyworthy',
        short_name: 'Storyworthy',
        description: 'Capture your storyworthy moments and gratitude daily',
        start_url: '/storyworthy/',
        scope: '/storyworthy/',
        display: 'standalone',
        theme_color: '#D4A59A',
        background_color: '#FAF8F5',
        orientation: 'portrait',
        icons: [
          {
            src: '/storyworthy/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
      }
    })
  ],
})
