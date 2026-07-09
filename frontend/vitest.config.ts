/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 20000,
    setupFiles: ['./src/test/setupTests.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/shared/components/**/*.{ts,tsx}',
        'src/shared/map/**/*.{ts,tsx}',
        'src/shared/types/**/*.{ts,tsx}',
        'src/shared/utils/**/*.{ts,tsx}',
        'src/features/**/*.{ts,tsx}',
      ],
      thresholds: { lines: 80 },
    },
  },
})
