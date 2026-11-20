import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  StreamableFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';

import { FILE_MIME_TYPES } from '../../framework/files';
import { AuthedUser, HasRole } from '../../simple-auth';
import { SurveyService } from '../survey.service';

import { type AuthedRespondent, toRespondent } from './survey.controller';
import { AnswerSurveyDto } from './survey.dto';
import { SurveyFilter } from './survey.filter';

// the routes and answer of the survey before its renaming, for the tabs opened on the previous release: to remove at the next one
@ApiExcludeController()
@UseInterceptors(SurveyFilter)
@Controller('/api/feedbacks/v1')
export class FormerSurveyController {
  constructor(private readonly survey: SurveyService) {}

  @Get('/answers.xlsx')
  @HasRole('ADMIN')
  @Header('Content-Type', FILE_MIME_TYPES.xlsx)
  listSurveysAsExcel(): Promise<StreamableFile> {
    return this.survey.listSurveysAsExcel();
  }

  @Get('/mine')
  @HasRole()
  async findSurvey(@AuthedUser() user: AuthedRespondent) {
    const { survey } = await this.survey.findSurvey({ respondent: toRespondent(user) });
    return { feedback: survey };
  }

  @Post('/answer')
  @HasRole()
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  answerSurvey(@AuthedUser() user: AuthedRespondent, @Body() answers: AnswerSurveyDto): Promise<void> {
    return this.survey.answerSurvey({ answers, respondent: toRespondent(user) });
  }
}
