import { Controller, Get } from '@nestjs/common';
import {
  ListSessionOfTypeGardeDesSceauxResponse,
  SessionService,
} from './infrastructure/sessions.service';
import { HasRole, AuthedUserId } from '../simple-auth';

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
}
