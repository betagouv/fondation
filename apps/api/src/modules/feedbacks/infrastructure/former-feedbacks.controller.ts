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
import { ApiExcludeController } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';

import { Pagination, QueryPagination } from '../../framework/pagination';
import { AuthedUser, HasRole } from '../../simple-auth';
import { FeedbacksService } from '../feedbacks.service';

import { ChangeFeedbackStatusDto, ListFeedbacksQueryDto, SendFeedbackDto } from './feedback.dto';
import { type ListedFeedback, ListedFeedbacksDto } from './queries/list-feedbacks.query';

// the routes of the feedbacks before their renaming, for the tabs opened on the previous release: to remove at the next one
@ApiExcludeController()
@Controller('/api/remarks/v1')
export class FormerFeedbacksController {
  constructor(private readonly feedbacks: FeedbacksService) {}

  @Get()
  @HasRole('ADMIN')
  @UsePipes(ZodValidationPipe)
  async listFeedbacks(
    @QueryPagination() pagination: Pagination,
    @Query() query: ListFeedbacksQueryDto,
  ): Promise<ListedFeedbacksDto> {
    // the previous page has no label for ACKNOWLEDGED and would crash on it: it shows and filters the feedback as still new
    const statuses = query.statuses ?? [];
    const listed = await this.feedbacks.listFeedbacks({
      pagination,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      statuses: statuses.includes('NEW') ? [...statuses, 'ACKNOWLEDGED'] : statuses,
    });
    // createPaginatedZodDto loses the type of its items
    const items = listed.items as ListedFeedback[];
    return {
      ...listed,
      items: items.map((item) =>
        item.status.value === 'ACKNOWLEDGED' ? { ...item, status: { ...item.status, value: 'NEW' } } : item,
      ),
    };
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

  @Put('/:remarkId/status')
  @HasRole('ADMIN')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  changeFeedbackStatus(
    @AuthedUser() user: { id: string },
    @Param('remarkId', ParseUUIDPipe) feedbackId: string,
    @Body() body: ChangeFeedbackStatusDto,
  ): Promise<void> {
    return this.feedbacks.changeFeedbackStatus({
      changedBy: user.id,
      feedbackId,
      status: { comment: body.comment, value: body.status },
    });
  }
}
