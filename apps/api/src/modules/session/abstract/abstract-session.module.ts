import { Module } from '@nestjs/common';
import { AbstractSessionController } from './abstract-session.controller';
import { AbstractSessionService } from './abstract-session.service';
import { CountNonValidatedSessionsQuery } from './infrastructure/queries/count-non-validated-sessions.query';
import { ListSessionsQuery } from './infrastructure/queries/list-sessions.query';

@Module({
  controllers: [AbstractSessionController],
  providers: [AbstractSessionService, ListSessionsQuery, CountNonValidatedSessionsQuery],
})
export class AbstractSessionModule {}
