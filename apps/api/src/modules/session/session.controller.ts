import { Controller, Get, Param } from '@nestjs/common';
import { TypeDeSaisine } from 'shared-models';
import { HasRole, AuthedUserId } from '../simple-auth';
import { SessionService } from './infrastructure/sessions.service';
import { type ListSessionOfTypeGardeDesSceauxResponse } from './infrastructure/queries/list-sessions-of-type-garde-des-sceaux.query';
import { type DetailedSessionResponse } from './infrastructure/queries/detail-session.query';

@Controller('/api/sessions/v2')
export class SessionController {
  constructor(private readonly sessions: SessionService) {}

  @HasRole()
  @Get('/garde-des-sceaux')
  listSessionsOfTypeGardeDesSceaux(
    @AuthedUserId() userId: string,
  ): Promise<ListSessionOfTypeGardeDesSceauxResponse> {
    return this.sessions.listSessionsOfTypeGardeDesSceaux(userId);
  }

  @HasRole()
  @Get('/garde-des-sceaux/:sessionId')
  detailSession(
    @AuthedUserId() userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<DetailedSessionResponse> {
    return this.sessions.detailSession({
      userId,
      sessionId,
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
    });
  }
}
