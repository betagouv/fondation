import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: [],
  categories: { correctness: 'off' },
  env: { builtin: true },
  ignorePatterns: ['jest*.config.js', 'dist', 'src/generated'],
  overrides: [
    {
      files: ['{src,cli,test}/**/*.ts'],
      rules: {
        'no-array-constructor': 'error',
        'no-unused-expressions': 'error',
        'no-unused-vars': 'error',
        'typescript/ban-ts-comment': 'error',
        'typescript/no-duplicate-enum-values': 'error',
        'typescript/no-empty-object-type': 'error',
        'typescript/no-explicit-any': 'off',
        'typescript/no-extra-non-null-assertion': 'error',
        'typescript/no-misused-new': 'error',
        'typescript/no-namespace': 'error',
        'typescript/no-non-null-asserted-optional-chain': 'error',
        'typescript/no-require-imports': 'error',
        'typescript/no-this-alias': 'error',
        'typescript/no-unnecessary-type-constraint': 'error',
        'typescript/no-unsafe-declaration-merging': 'error',
        'typescript/no-unsafe-function-type': 'error',
        'typescript/no-wrapper-object-types': 'error',
        'typescript/prefer-as-const': 'error',
        'typescript/triple-slash-reference': 'error',
        'unicorn/prefer-node-protocol': 'error',
        'typescript/await-thenable': 'error',
      },
      plugins: ['typescript', 'unicorn'],
      env: {
        jest: true,
        node: true,
      },
    },
  ],
});
