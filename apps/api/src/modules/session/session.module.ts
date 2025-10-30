import { Module } from '@nestjs/common';
import { DetailSessionQuery } from './infrastructure/queries/detail-session.query';
import { ListSessionOfTypeGardeDesSceauxQuery } from './infrastructure/queries/list-sessions-of-type-garde-des-sceaux.query';
import { SessionService } from './infrastructure/sessions.service';
import { SessionController } from './session.controller';

@Module({
  controllers: [SessionController],
  providers: [
    SessionService,
    DetailSessionQuery,
    ListSessionOfTypeGardeDesSceauxQuery,
  ],
})
export class SessionModule {}
