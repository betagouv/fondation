import { Module } from '@nestjs/common';

import { SessionModule } from 'src/modules/session/session.module';
import { MembersModule } from '../members';
import { DocsService } from './docs.service';
import { DocsController } from './infrastructure/docs.controller';
import { AgendaNominationFilesFinder } from './infrastructure/finders/agenda-nomination-files.finder';
import { FindChairmenQuery } from './infrastructure/queries/find-chairmen.query';
import { FindAgendaNominationFilesQuery } from './infrastructure/queries/find-nomination-files.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';

@Module({
  imports: [SessionModule, MembersModule],
  controllers: [DocsController],
  providers: [
    AgendaNominationFilesFinder,
    AgendaRepository,
    DocsService,
    FindAgendaNominationFilesQuery,
    FindChairmenQuery,
  ],
  exports: [DocsService],
})
export class DocsModule {}
