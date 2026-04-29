import type { APIRequestContext } from '@playwright/test';
import { AuthHttpClient } from './auth.fixture';
import { HttpClient } from './http-client.fixture';
import { SessionsHttpClient } from './sessions.fixture';

export class ApiHttpClient {
  readonly auth: AuthHttpClient;
  readonly sessions: SessionsHttpClient;

  constructor(request: APIRequestContext) {
    const http = new HttpClient(request);

    this.auth = new AuthHttpClient(http);
    this.sessions = new SessionsHttpClient(http);
  }
}
