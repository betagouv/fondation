import { Module } from '@nestjs/common';

import { ArchivedSessionsController } from './archived-sessions.controller';
import { ArchivedSessionsService } from './archived-sessions.service';
import { ListArchivedNominationSessionsQuery } from './infrastructure/queries/list-archived-nomination-sessions.query';

@Module({
  providers: [ListArchivedNominationSessionsQuery, ArchivedSessionsService],
  controllers: [ArchivedSessionsController],
  exports: [ArchivedSessionsService],
})
export class ArchivedSessionsModule {}
