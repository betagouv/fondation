import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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

import { FeedbackFilter } from './feedback.filter';
import { FoundSessionFeedbackDto } from './queries/find-session-feedback.query';
import { AnswerSessionFeedbackDto } from './session-feedback.dto';

type AuthedRespondent = { id: string; impersonation?: { impersonatorId: string }; role: RoleEnum };

function toRespondent(user: AuthedRespondent) {
  return { id: user.id, isImpersonated: !!user.impersonation, role: user.role };
}

@ApiTags('Feedback')
@UseInterceptors(FeedbackFilter)
@Controller('/api/session-feedbacks/v1')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Get('/answers.xlsx')
  @HasRole('ADMIN')
  @Header('Content-Type', FILE_MIME_TYPES.xlsx)
  listSessionFeedbacksAsExcel(): Promise<StreamableFile> {
    return this.feedback.listSessionFeedbacksAsExcel();
  }

  @Get('/:sessionId')
  @HasRole()
  @ZodResponse({ status: HttpStatus.OK, type: FoundSessionFeedbackDto })
  findSessionFeedback(
    @AuthedUser() user: AuthedRespondent,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<FoundSessionFeedbackDto> {
    return this.feedback.findSessionFeedback({ respondent: toRespondent(user), sessionId });
  }

  @Post('/:sessionId/answer')
  @HasRole()
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  answerSessionFeedback(
    @AuthedUser() user: AuthedRespondent,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() answers: AnswerSessionFeedbackDto,
  ): Promise<void> {
    return this.feedback.answerSessionFeedback({ answers, respondent: toRespondent(user), sessionId });
  }
}
