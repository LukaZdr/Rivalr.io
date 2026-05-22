import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/Rivalr.io/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
