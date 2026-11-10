import { Module } from '@nestjs/common';

import { FormerSurveyController } from './infrastructure/former-survey.controller';
import { FindSurveyQuery } from './infrastructure/queries/find-survey.query';
import { ListSurveysAsExcelQuery } from './infrastructure/queries/list-surveys-as-excel.query';
import { SurveyController } from './infrastructure/survey.controller';
import { SurveyRepository } from './infrastructure/survey.repository';
import { SurveyService } from './survey.service';

@Module({
  controllers: [FormerSurveyController, SurveyController],
  providers: [SurveyRepository, SurveyService, FindSurveyQuery, ListSurveysAsExcelQuery],
})
export class SurveyModule {}
