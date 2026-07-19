import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve straight to the workspace package's TS source so Rollup can
      // statically analyze real ESM `export` statements instead of the
      // package's compiled CommonJS build (which the backend consumes).
      '@avtoschoole/shared': fileURLToPath(new URL('../packages/shared/src/index.ts', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
