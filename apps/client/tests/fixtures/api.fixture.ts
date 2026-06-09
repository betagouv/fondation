import type { APIRequestContext } from '@playwright/test';

import { AuthHttpClient } from './auth.fixture';

export class ApiHttpClient {
  readonly auth: AuthHttpClient;

  constructor(readonly http: APIRequestContext) {
    this.auth = new AuthHttpClient(http);
  }
}
