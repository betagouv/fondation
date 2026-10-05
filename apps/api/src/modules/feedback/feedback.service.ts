import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, StreamableFile } from '@nestjs/common';

import type { Respondent, SessionFeedbackAnswers } from './domain/session-feedback';
import {
  FindSessionFeedbackQuery,
  FoundSessionFeedbackDto,
} from './infrastructure/queries/find-session-feedback.query';
import { ListSessionFeedbacksAsExcelQuery } from './infrastructure/queries/list-session-feedbacks-as-excel.query';
import { SessionFeedbackRepository } from './infrastructure/session-feedback.repository';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly findSessionFeedbackQuery: FindSessionFeedbackQuery,
    private readonly listSessionFeedbacksAsExcelQuery: ListSessionFeedbacksAsExcelQuery,
    private readonly sessionFeedbackRepository: SessionFeedbackRepository,
  ) {}

  findSessionFeedback(query: {
    respondent: Respondent;
    sessionId: string;
  }): Promise<FoundSessionFeedbackDto> {
    return this.findSessionFeedbackQuery.handle(query);
  }

  listSessionFeedbacksAsExcel(): Promise<StreamableFile> {
    return this.listSessionFeedbacksAsExcelQuery.handle();
  }

  @Transactional()
  async answerSessionFeedback(command: {
    answers: SessionFeedbackAnswers;
    respondent: Respondent;
    sessionId: string;
  }): Promise<void> {
    const feedback = await this.sessionFeedbackRepository.findBySession({
      sessionId: command.sessionId,
      userId: command.respondent.id,
    });
    feedback.answer({ answers: command.answers, respondent: command.respondent });
    await this.sessionFeedbackRepository.persist(feedback);
  }
}
