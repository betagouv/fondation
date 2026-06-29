import 'vitest';

declare module 'vitest' {
  interface ProvidedContext {
    apiUrl: string;
  }
}

export {};
