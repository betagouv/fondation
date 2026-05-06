import { forwardRef, Module } from '@nestjs/common';

import { SimpleAuthModule } from 'src/modules/simple-auth';

import { DetailSummaryQuery } from './infrastructure/queries/detail-summary.query';
import { GetSummaryAttachmentUrlQuery } from './infrastructure/queries/get-summary-attachment-url.query';
import { SummaryRepository } from './infrastructure/repositories/summary.repository';
import { SummaryService } from './infrastructure/summary.service';
import { SummaryController } from './summary.controller';

@Module({
  imports: [forwardRef(() => SimpleAuthModule)],
  controllers: [SummaryController],
  providers: [SummaryRepository, SummaryService, DetailSummaryQuery, GetSummaryAttachmentUrlQuery],
  exports: [SummaryService],
})
export class SummaryModule {}
