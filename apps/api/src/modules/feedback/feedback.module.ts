import { Module } from '@nestjs/common';

import { FeedbackService } from './feedback.service';
import { FeedbackController } from './infrastructure/feedback.controller';
import { FindSessionFeedbackQuery } from './infrastructure/queries/find-session-feedback.query';
import { ListSessionFeedbacksAsExcelQuery } from './infrastructure/queries/list-session-feedbacks-as-excel.query';
import { SessionFeedbackRepository } from './infrastructure/session-feedback.repository';

@Module({
  controllers: [FeedbackController],
  providers: [
    FeedbackService,
    FindSessionFeedbackQuery,
    ListSessionFeedbacksAsExcelQuery,
    SessionFeedbackRepository,
  ],
})
export class FeedbackModule {}
