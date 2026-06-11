import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:3000/openapi/root.json',
  output: {
    indexFile: false,
    path: 'src/generated/api',
    importFileExtension: '.ts',
    fileName: { suffix: null },
    header: [
      `/* oxlint-disable */`,
      `// this file is auto-generated`,
      '//',
      `// Licensed under the Apache License, Version 2.0`,
      '//',
    ],
  },
  plugins: [
    {
      name: '@hey-api/typescript',
      definitions: (name: string) => name.replace(/Output$/, ''),
    },
    {
      name: '@hey-api/client-fetch',
      runtimeConfigPath: '../../utils/http.config.ts',
      throwOnError: false,
    },
    {
      name: '@hey-api/sdk',
      transformer: false,
      operations: {
        strategy: 'byTags',
        containerName: { casing: 'camelCase' },
      },
    },
  ],
  parser: {
    pagination: { keywords: [] },
    hooks: {
      operations: {
        isMutation: (operation) =>
          operation.method !== 'get' ||
          operation.id === 'createNominationSessionAttachmentUrl' ||
          operation.id === 'createNominationFileAttachmentUrl',
      },
    },
  },
});
