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
    // Margin-trading suite has its own config + setup — run via `npm run test:margin`
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/margin-trading/**',
      // Playwright quản lý E2E trên trình duyệt; Vitest không được import các spec này.
      'tests/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        // Coverage ratchet applies to shipped app/feature/shared code. Increase
        // each threshold per vertical slice; certification targets are
        // lines/statements >= 90, branches >= 80, functions >= 85.
        lines: 86,
        statements: 84,
        functions: 79,
        branches: 80,
      },
      exclude: [
        'node_modules/',
        'src/test/',
        // Node-based repository tooling is verified by its own inventory checks.
        'scripts/',
        // Development-only demos and fixtures are tested separately from the
        // production coverage denominator and are excluded from shipped code.
        'src/dev/',
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
