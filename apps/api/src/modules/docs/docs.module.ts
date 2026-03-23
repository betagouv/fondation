import { Module } from '@nestjs/common';

import { DocsService } from './docs.service';
import { DocsController } from './infrastructure/docs.controller';
import { FindChairmenQuery } from './infrastructure/queries/find-chairmen.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';

@Module({
  controllers: [DocsController],
  providers: [FindChairmenQuery, AgendaRepository, DocsService],
  exports: [DocsService],
})
export class DocsModule {}
