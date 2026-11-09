import { Module } from '@nestjs/common';

import { FindSurveyQuery } from './infrastructure/queries/find-survey.query';
import { ListSurveysAsExcelQuery } from './infrastructure/queries/list-surveys-as-excel.query';
import { SurveyController } from './infrastructure/survey.controller';
import { SurveyRepository } from './infrastructure/survey.repository';
import { SurveyService } from './survey.service';

@Module({
  controllers: [SurveyController],
  providers: [SurveyRepository, SurveyService, FindSurveyQuery, ListSurveysAsExcelQuery],
})
export class SurveyModule {}
