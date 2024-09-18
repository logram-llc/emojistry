import { defineConfig, configDefaults, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig((configEnv) =>
  mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      test: {
        environment: 'jsdom',
        setupFiles: ['./setupTest.ts'],
        coverage: {
          reporter: ['text', 'json', 'html'],
          exclude: [
            ...(configDefaults?.coverage?.exclude ?? []),
            './scripts/assets/*',
            './public/*',
            '*.config.js',
            './build/*',
            './src/components/icons/*',
          ],
        },
        exclude: [
          ...configDefaults.exclude,
          './scripts/assets/*',
          './public/*',
          './build/*',
        ],
      },
    }),
  ),
);
