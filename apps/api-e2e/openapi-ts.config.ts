import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:3000/openapi/root.json',
  output: {
    indexFile: false,
    path: 'src/generated/api',
    importFileExtension: '.ts',
    fileName: { suffix: null },
    header: ['/* oxlint-disable */', '// this file is auto-generated'],
  },
  plugins: [
    { name: '@hey-api/typescript', definitions: (name: string) => name.replace(/Output$/, '') },
    { name: '@hey-api/client-fetch', throwOnError: false },
    {
      name: '@hey-api/sdk',
      transformer: false,
      operations: {
        strategy: 'byTags',
        containerName: { casing: 'camelCase' },
      },
    },
  ],
  parser: { pagination: { keywords: [] } },
});
