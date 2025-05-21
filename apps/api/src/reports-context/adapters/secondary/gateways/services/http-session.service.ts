import { NominationsContextSessionsRestContract } from 'shared-models';
import { SessionService } from 'src/reports-context/business-logic/gateways/services/session.service';
import { BoundedContextHttpClient } from 'src/shared-kernel/adapters/secondary/gateways/providers/bounded-context-htttp-client';

export class HttpSessionService implements SessionService {
  constructor(
    private readonly httpClient: BoundedContextHttpClient<NominationsContextSessionsRestContract>,
  ) {}

  async session(sessionId: string) {
    return this.httpClient.fetch<'sessionSnapshot'>({
      method: 'GET',
      params: { sessionId },
      path: 'session/snapshot/by-id/:sessionId',
    });
  }
}
