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
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { FILE_MIME_TYPES } from '../../framework/files';
import type { RoleEnum } from '../../shared/role.enum';
import { AuthedUser, HasRole } from '../../simple-auth';
import { SurveyService } from '../survey.service';

import { FoundSurveyDto } from './queries/find-survey.query';
import { AnswerSurveyDto } from './survey.dto';
import { SurveyFilter } from './survey.filter';

export type AuthedRespondent = {
  id: string;
  impersonation?: { impersonatorId: string };
  isAdmin: boolean;
  role: RoleEnum;
};

export function toRespondent(user: AuthedRespondent) {
  return { id: user.id, isAdmin: user.isAdmin, isImpersonated: !!user.impersonation, role: user.role };
}

@ApiTags('Surveys')
@UseInterceptors(SurveyFilter)
@Controller('/api/surveys/v1')
export class SurveyController {
  constructor(private readonly survey: SurveyService) {}

  @Get('/answers.xlsx')
  @HasRole('ADMIN')
  @Header('Content-Type', FILE_MIME_TYPES.xlsx)
  listSurveysAsExcel(): Promise<StreamableFile> {
    return this.survey.listSurveysAsExcel();
  }

  @Get('/mine')
  @HasRole()
  @ZodResponse({ status: HttpStatus.OK, type: FoundSurveyDto })
  findSurvey(@AuthedUser() user: AuthedRespondent): Promise<FoundSurveyDto> {
    return this.survey.findSurvey({ respondent: toRespondent(user) });
  }

  @Post('/answer')
  @HasRole()
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  answerSurvey(@AuthedUser() user: AuthedRespondent, @Body() answers: AnswerSurveyDto): Promise<void> {
    return this.survey.answerSurvey({
      answers,
      respondent: toRespondent(user),
    });
  }
}
