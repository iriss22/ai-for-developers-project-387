import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// В e2e-прогоне (playwright.config.ts) `vite preview` поднимается на свободном порту
// и должен проксировать /api на собранный бэкенд, который слушает CALENDAR_API_PORT
// (в dev-режиме бэкенд всегда на 8080).
const backendPort = process.env.CALENDAR_API_PORT ?? '8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // В dev-режиме запросы /api уходят на Spring Boot
      '/api': 'http://localhost:8080',
    },
  },
  preview: {
    proxy: {
      // В e2e-прогоне (`vite preview`, см. playwright.config.ts) — на собранный бэкенд
      '/api': `http://localhost:${backendPort}`,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // e2e/ — отдельный слой на Playwright (playwright.config.ts), не юнит-тесты Vitest
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
