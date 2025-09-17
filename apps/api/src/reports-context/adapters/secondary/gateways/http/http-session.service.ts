import { NominationsContextSessionsRestContract } from 'shared-models';
import { BoundedContextHttpClient } from 'src/shared-kernel/adapters/secondary/gateways/providers/bounded-context-htttp-client';
import { SessionService } from 'src/shared-kernel/business-logic/gateways/services/session.service';

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
