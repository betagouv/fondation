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

import { FeedbackService } from '../feedback.service';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import { AnswerFeedbackDto } from './feedback.dto';
import { FeedbackFilter } from './feedback.filter';
import { FoundFeedbackDto } from './queries/find-feedback.query';

type AuthedRespondent = {
  id: string;
  impersonation?: { impersonatorId: string };
  role: RoleEnum;
};

function toRespondent(user: AuthedRespondent) {
  return { id: user.id, isImpersonated: !!user.impersonation, role: user.role };
}

@ApiTags('Feedback')
@UseInterceptors(FeedbackFilter)
@Controller('/api/feedbacks/v1')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Get('/answers.xlsx')
  @HasRole('ADMIN')
  @Header('Content-Type', FILE_MIME_TYPES.xlsx)
  listFeedbacksAsExcel(): Promise<StreamableFile> {
    return this.feedback.listFeedbacksAsExcel();
  }

  @Get('/mine')
  @HasRole()
  @ZodResponse({ status: HttpStatus.OK, type: FoundFeedbackDto })
  findFeedback(@AuthedUser() user: AuthedRespondent): Promise<FoundFeedbackDto> {
    return this.feedback.findFeedback({ respondent: toRespondent(user) });
  }

  @Post('/answer')
  @HasRole()
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  answerFeedback(@AuthedUser() user: AuthedRespondent, @Body() answers: AnswerFeedbackDto): Promise<void> {
    return this.feedback.answerFeedback({
      answers,
      respondent: toRespondent(user),
    });
  }
}
