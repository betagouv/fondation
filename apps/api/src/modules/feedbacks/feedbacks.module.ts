import { Module } from '@nestjs/common';

import { FeedbacksService } from './feedbacks.service';
import { FeedbackRepository } from './infrastructure/feedback.repository';
import { FeedbacksController } from './infrastructure/feedbacks.controller';
import { FormerFeedbacksController } from './infrastructure/former-feedbacks.controller';
import { ListFeedbacksQuery } from './infrastructure/queries/list-feedbacks.query';

@Module({
  controllers: [FeedbacksController, FormerFeedbacksController],
  providers: [ListFeedbacksQuery, FeedbackRepository, FeedbacksService],
})
export class FeedbacksModule {}
