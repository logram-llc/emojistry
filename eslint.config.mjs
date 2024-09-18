// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import eslintReact from 'eslint-plugin-react/configs/recommended.js';
import jsxRuntime from 'eslint-plugin-react/configs/jsx-runtime.js';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  prettierConfig,
  eslintReact,
  jsxRuntime,
  {
    ignores: [
      "scripts/assets/**/*",
      "public/**/*",
      "build/**/*",
      "tailwind.config.js",
      "postcss.config.js"
    ],
  },
  {
    rules: {
      'react/prop-types': 'off',
    }
  }
);