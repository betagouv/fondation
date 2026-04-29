import type { APIRequestContext } from '@playwright/test';
import { AuthHttpClient } from './auth.fixture';
import { SessionsHttpClient } from './sessions.fixture';

export class ApiHttpClient {
  readonly auth: AuthHttpClient;
  readonly sessions: SessionsHttpClient;

  constructor(http: APIRequestContext) {
    this.auth = new AuthHttpClient(http);
    this.sessions = new SessionsHttpClient(http);
  }
}
