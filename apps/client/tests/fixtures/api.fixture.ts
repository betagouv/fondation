import type { APIRequestContext } from '@playwright/test';
import { AuthHttpClient } from './auth.fixture';
import { DataHttpClient } from './data.fixture';
import { SessionsHttpClient } from './sessions.fixture';

export class ApiHttpClient {
  readonly auth: AuthHttpClient;
  readonly sessions: SessionsHttpClient;
  readonly data: DataHttpClient;

  constructor(http: APIRequestContext) {
    this.auth = new AuthHttpClient(http);
    this.sessions = new SessionsHttpClient(http);
    this.data = new DataHttpClient(http);
  }
}
