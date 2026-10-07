import { inspect } from 'node:util';

import { isAxiosError } from 'axios';

// An HTTP error carries its whole request: credentials, headers and URLs that may embed a secret token.
// Its message is enough to understand what failed.
export function describeErrorWithoutSecrets(error: unknown): string {
  if (isAxiosError(error)) return `${error.name}: ${error.message}`;
  return inspect(error);
}
