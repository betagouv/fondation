import { Injectable } from '@nestjs/common';

import { ListSessionOfTypeGardeDesSceauxQuery } from './queries/list-sessions-of-type-garde-des-sceaux.query';
import { DetailSessionQuery } from './queries/detail-session.query';
import { TypeDeSaisine } from 'shared-models';

@Injectable()
export class SessionService {
  constructor(
    private readonly listSessionsOfTypeGardeDesSceauxQuery: ListSessionOfTypeGardeDesSceauxQuery,
    private readonly detailSessionQuery: DetailSessionQuery,
  ) {}

  listSessionsOfTypeGardeDesSceaux(userId: string) {
    return this.listSessionsOfTypeGardeDesSceauxQuery.handle({ userId });
  }

  detailSession(query: {
    userId: string;
    sessionId: string;
    typeDeSaisine: TypeDeSaisine;
  }) {
    return this.detailSessionQuery.handle(query);
  }
}
