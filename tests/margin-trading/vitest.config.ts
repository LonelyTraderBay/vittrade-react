/**
 * ══════════════════════════════════════════════════════════════════
 *  VITEST CONFIGURATION - MARGIN TRADING TESTS
 * ══════════════════════════════════════════════════════════════════
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, './setup.ts')],
    // Scope to this suite only — the root vitest.config.ts covers the app tests.
    include: ['tests/margin-trading/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/app/components/trading/**/*.{ts,tsx}',
        'src/app/pages/trade/**/*.{ts,tsx}',
        'src/app/providers/MarketDataWSProvider.tsx',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/node_modules/**',
        '**/dist/**',
      ],
      thresholds: {
        lines: 90,
        functions: 85,
        branches: 80,
        statements: 90,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      '@components': path.resolve(__dirname, '../../src/app/components'),
      '@pages': path.resolve(__dirname, '../../src/app/pages'),
      '@hooks': path.resolve(__dirname, '../../src/app/hooks'),
      '@utils': path.resolve(__dirname, '../../src/app/utils'),
    },
  },
});
