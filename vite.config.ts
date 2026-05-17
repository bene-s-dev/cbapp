import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      disable: process.env.NODE_ENV === 'development', // Disable in dev
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'vorschau.png'],
      manifest: {
        name: 'Bisou',
        short_name: 'Bisou',
        description: 'Deine tägliche Verbindung zum Partner',
        theme_color: '#F8F7FF',
        background_color: '#F8F7FF',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/?mode=standalone',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
