import { Module } from '@nestjs/common';
import { AbstractSessionController } from './abstract-session.controller';
import { AbstractSessionService } from './abstract-session.service';
import { ListSessionAttachmentsQuery } from './infrastructure/queries/list-session-attachments.query';
import { ListSessionsQuery } from './infrastructure/queries/list-sessions.query';

@Module({
  controllers: [AbstractSessionController],
  providers: [AbstractSessionService, ListSessionsQuery, ListSessionAttachmentsQuery],
})
export class AbstractSessionModule {}
