import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
    },
    server: {
      watch: {
        ignored: [
          path.join(__dirname, 'scripts', 'assets'),
          path.join(__dirname, 'public', 'emojis'),
        ],
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
