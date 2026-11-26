import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/TaskList/',
  plugins: [react()],
  test: { include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'], environment: 'jsdom', globals: true, setupFiles: ['./src/setupTests.ts'] },
})
