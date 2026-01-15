import { forwardRef, Module } from '@nestjs/common';

import { SummaryController } from './summary.controller';
import { SummaryRepository } from './infrastructure/repositories/summary.repository';
import { SummaryService } from './infrastructure/summary.service';
import { DetailSummaryQuery } from './infrastructure/queries/detail-summary.query';

import { SimpleAuthModule } from 'src/modules/simple-auth';

@Module({
  imports: [forwardRef(() => SimpleAuthModule)],
  controllers: [SummaryController],
  providers: [SummaryRepository, SummaryService, DetailSummaryQuery],
  exports: [SummaryService],
})
export class SummaryModule {}
