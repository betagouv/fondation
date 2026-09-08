import 'vitest';

declare module 'vitest' {
  interface ProvidedContext {
    apiUrl: string;
    databaseUrl: string;
    mattermostUrl: string;
  }
}

export {};
