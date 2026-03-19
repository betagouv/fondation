// @ts-check

import prettier from 'eslint-config-prettier/flat';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['.eslintrc.js', 'jest*.config.js', 'dist', 'src/generated'] },
  {
    extends: [tseslint.configs.recommended, prettierRecommended],
    files: ['{src,cli,test}/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      ...prettier.rules,
    },
  },
);
