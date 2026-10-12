import { Module } from '@nestjs/common';

import { FeedbackService } from './feedback.service';
import { FeedbackController } from './infrastructure/feedback.controller';
import { FeedbackRepository } from './infrastructure/feedback.repository';
import { FindFeedbackQuery } from './infrastructure/queries/find-feedback.query';
import { ListFeedbacksAsExcelQuery } from './infrastructure/queries/list-feedbacks-as-excel.query';

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackRepository, FeedbackService, FindFeedbackQuery, ListFeedbacksAsExcelQuery],
})
export class FeedbackModule {}
