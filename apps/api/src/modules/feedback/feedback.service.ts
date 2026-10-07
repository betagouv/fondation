import { Transactional } from '@nestjs-cls/transactional';
import { Inject, Injectable, StreamableFile } from '@nestjs/common';

import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';

import { Feedback, type FeedbackAnswers, type Respondent } from './domain/feedback';
import { FeedbackRepository } from './infrastructure/feedback.repository';
import { FindFeedbackQuery, FoundFeedbackDto } from './infrastructure/queries/find-feedback.query';
import { ListFeedbacksAsExcelQuery } from './infrastructure/queries/list-feedbacks-as-excel.query';

@Injectable()
export class FeedbackService {
  constructor(
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
    private readonly feedbackRepository: FeedbackRepository,
    private readonly findFeedbackQuery: FindFeedbackQuery,
    private readonly listFeedbacksAsExcelQuery: ListFeedbacksAsExcelQuery,
  ) {}

  findFeedback(query: { respondent: Respondent }): Promise<FoundFeedbackDto> {
    return this.findFeedbackQuery.handle(query);
  }

  listFeedbacksAsExcel(): Promise<StreamableFile> {
    return this.listFeedbacksAsExcelQuery.handle();
  }

  @Transactional()
  async answerFeedback(command: { answers: FeedbackAnswers; respondent: Respondent }): Promise<void> {
    const feedback = new Feedback();
    feedback.answer({ ...command, environment: { isTest: this.config.isTestEnvironment } });
    await this.feedbackRepository.persist(feedback);
  }
}
