import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
    // Force all packages (motion, recharts, radix-ui, …) to share the
    // exact same React instance, preventing "Invalid hook call" and
    // "multiple React instances" errors.
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router',
      '@radix-ui/react-context',
      '@radix-ui/react-primitive',
      'vaul',
    ],
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/');
          if (normalizedId.includes('/node_modules/victory-vendor/')) return 'vendor-chart-math';
          if (normalizedId.includes('/node_modules/recharts/')) return 'vendor-recharts';
          if (normalizedId.includes('/node_modules/lightweight-charts/')) {
            return 'vendor-lightweight-charts';
          }
          if (normalizedId.includes('/node_modules/motion/')) return 'vendor-motion';
          if (
            [
              '/node_modules/react/',
              '/node_modules/react-dom/',
              '/node_modules/react-router/',
            ].some((packagePath) => normalizedId.includes(packagePath))
          ) {
            return 'vendor-react';
          }
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
});
