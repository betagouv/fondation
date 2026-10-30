import { forwardRef, Module } from '@nestjs/common';

import { SimpleAuthModule } from '../../simple-auth';
import { TransparenceModule } from '../transparence/transparence.module';

import { DetailSummaryQuery } from './infrastructure/queries/detail-summary.query';
import { GetSummaryAttachmentUrlQuery } from './infrastructure/queries/get-summary-attachment-url.query';
import { ListSummaryReadersQuery } from './infrastructure/queries/list-summary-readers.query';
import { SummaryRepository } from './infrastructure/summary.repository';
import { SummaryService } from './infrastructure/summary.service';
import { SummaryController } from './summary.controller';

@Module({
  imports: [forwardRef(() => SimpleAuthModule), forwardRef(() => TransparenceModule)],
  controllers: [SummaryController],
  providers: [
    SummaryRepository,
    SummaryService,
    DetailSummaryQuery,
    GetSummaryAttachmentUrlQuery,
    ListSummaryReadersQuery,
  ],
  exports: [SummaryService],
})
export class SummaryModule {}
