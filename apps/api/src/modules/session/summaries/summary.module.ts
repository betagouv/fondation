import { forwardRef, Module } from '@nestjs/common';

import { TransparenceModule } from 'src/modules/session/transparence/transparence.module';
import { SimpleAuthModule } from 'src/modules/simple-auth';

import { DetailSummaryQuery } from './infrastructure/queries/detail-summary.query';
import { GetSummaryAttachmentUrlQuery } from './infrastructure/queries/get-summary-attachment-url.query';
import { SummaryRepository } from './infrastructure/summary.repository';
import { SummaryService } from './infrastructure/summary.service';
import { SummaryController } from './summary.controller';

@Module({
  imports: [forwardRef(() => SimpleAuthModule), forwardRef(() => TransparenceModule)],
  controllers: [SummaryController],
  providers: [SummaryRepository, SummaryService, DetailSummaryQuery, GetSummaryAttachmentUrlQuery],
  exports: [SummaryService],
})
export class SummaryModule {}
