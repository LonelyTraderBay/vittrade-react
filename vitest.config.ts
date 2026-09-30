import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 15_000,
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // Playwright quản lý E2E trên trình duyệt; Vitest không được import các spec này.
      'tests/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/app/**/*.{ts,tsx}',
        'src/features/**/*.{ts,tsx}',
        'src/shared/**/*.{ts,tsx}',
      ],
      thresholds: {
        // Enforce the frontend certification targets over the explicit source
        // denominator; route composition and dev-only code have separate gates.
        lines: 90,
        statements: 90,
        functions: 85,
        branches: 80,
      },
      exclude: [
        'node_modules/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/__tests__/**',
        // Route maps are checked by the generated inventory, route boundaries,
        // build and browser smoke; lazy-import declarations are not app logic.
        '**/routes.ts',
        'src/test/',
        // Node-based repository tooling is verified by its own inventory checks.
        'scripts/',
        // Development-only demos and fixtures are tested separately from the
        // production coverage denominator and are excluded from shipped code.
        'src/dev/',
        'src/app/components/dev/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        // App route composition has route contract, inventory and production-boundary gates.
        '**/routeConfig.ts',
        'src/app/routes/**',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
