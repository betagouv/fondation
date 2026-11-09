import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Pagination } from '../framework/pagination';
import { Sortable } from '../framework/sorting';

import { Feedback, type FeedbackStatus, type FeedbackStatusWithComment } from './domain/feedback';
import type { ListFeedbacksQueryDto } from './infrastructure/feedback.dto';
import { FeedbackRepository } from './infrastructure/feedback.repository';
import { ListFeedbacksQuery, ListedFeedbacksDto } from './infrastructure/queries/list-feedbacks.query';

@Injectable()
export class FeedbacksService {
  constructor(
    private readonly listFeedbacksQuery: ListFeedbacksQuery,
    private readonly feedbackRepository: FeedbackRepository,
  ) {}

  listFeedbacks(query: {
    pagination: Pagination;
    sorting: Sortable<ListFeedbacksQueryDto>;
    statuses: readonly FeedbackStatus[];
  }): Promise<ListedFeedbacksDto> {
    return this.listFeedbacksQuery.handle(query);
  }

  @Transactional()
  async sendFeedback(command: {
    sender: { id: string; impersonatorId: string | null };
    text: string;
    url: string;
  }): Promise<void> {
    await this.feedbackRepository.persist(Feedback.send(command));
  }

  @Transactional()
  async changeFeedbackStatus(command: {
    changedBy: string;
    feedbackId: string;
    status: FeedbackStatusWithComment;
  }): Promise<void> {
    const feedback = await this.feedbackRepository.find(command);
    feedback.changeStatus(command);
    await this.feedbackRepository.persist(feedback);
  }
}
