import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiPaginated, Pagination, QueryPagination } from '../../framework/pagination';
import { AuthedUser, HasRole } from '../../simple-auth';
import { FeedbacksService } from '../feedbacks.service';

import { ChangeFeedbackStatusDto, ListFeedbacksQueryDto, SendFeedbackDto } from './feedback.dto';
import { ListedFeedbacksDto } from './queries/list-feedbacks.query';

@ApiTags('Feedbacks')
@Controller('/api/feedbacks/v1')
export class FeedbacksController {
  constructor(private readonly feedbacks: FeedbacksService) {}

  @Get()
  @HasRole('ADMIN')
  @ApiPaginated()
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.OK, type: ListedFeedbacksDto })
  listFeedbacks(
    @QueryPagination() pagination: Pagination,
    @Query() query: ListFeedbacksQueryDto,
  ): Promise<ListedFeedbacksDto> {
    return this.feedbacks.listFeedbacks({
      pagination,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      statuses: query.statuses ?? [],
    });
  }

  @Post()
  @HasRole()
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  sendFeedback(
    @AuthedUser() user: { id: string; impersonation?: { impersonatorId: string } },
    @Body() feedback: SendFeedbackDto,
  ): Promise<void> {
    return this.feedbacks.sendFeedback({
      ...feedback,
      sender: { id: user.id, impersonatorId: user.impersonation?.impersonatorId ?? null },
    });
  }

  @Put('/:feedbackId/status')
  @HasRole('ADMIN')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  changeFeedbackStatus(
    @AuthedUser() user: { id: string },
    @Param('feedbackId', ParseUUIDPipe) feedbackId: string,
    @Body() body: ChangeFeedbackStatusDto,
  ): Promise<void> {
    return this.feedbacks.changeFeedbackStatus({
      changedBy: user.id,
      feedbackId,
      status: { comment: body.comment, value: body.status },
    });
  }
}
