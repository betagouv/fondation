import { Transactional } from '@nestjs-cls/transactional';
import { Inject, Injectable, StreamableFile } from '@nestjs/common';

import { API_CONFIG_TOKEN, ApiConfig } from '../framework/config';

import { Survey, type SurveyAnswers, type Respondent } from './domain/survey';
import { FindSurveyQuery, FoundSurveyDto } from './infrastructure/queries/find-survey.query';
import { ListSurveysAsExcelQuery } from './infrastructure/queries/list-surveys-as-excel.query';
import { SurveyRepository } from './infrastructure/survey.repository';

@Injectable()
export class SurveyService {
  constructor(
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
    private readonly surveyRepository: SurveyRepository,
    private readonly findSurveyQuery: FindSurveyQuery,
    private readonly listSurveysAsExcelQuery: ListSurveysAsExcelQuery,
  ) {}

  findSurvey(query: { respondent: Respondent }): Promise<FoundSurveyDto> {
    return this.findSurveyQuery.handle(query);
  }

  listSurveysAsExcel(): Promise<StreamableFile> {
    return this.listSurveysAsExcelQuery.handle();
  }

  @Transactional()
  async answerSurvey(command: { answers: SurveyAnswers; respondent: Respondent }): Promise<void> {
    const survey = new Survey();
    survey.answer({ ...command, environment: { isTest: this.config.isTestEnvironment } });
    await this.surveyRepository.persist(survey);
  }
}
