import type { APIRequestContext } from '@playwright/test';
import { AuthHttpClient } from './auth.fixture';
import { JurisdictionHttpClient } from './jurisdiction.fixture';
import { SessionsHttpClient } from './sessions.fixture';

export class ApiHttpClient {
  readonly auth: AuthHttpClient;
  readonly sessions: SessionsHttpClient;
  readonly jurisdictions: JurisdictionHttpClient;

  constructor(http: APIRequestContext) {
    this.auth = new AuthHttpClient(http);
    this.sessions = new SessionsHttpClient(http);
    this.jurisdictions = new JurisdictionHttpClient(http);
  }
}
