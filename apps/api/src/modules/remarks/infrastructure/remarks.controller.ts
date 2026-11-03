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
import { RemarksService } from '../remarks.service';

import { ListedRemarksDto } from './queries/list-remarks.query';
import { ChangeRemarkStatusDto, ListRemarksQueryDto, SendRemarkDto } from './remark.dto';

@ApiTags('Remarks')
@Controller('/api/remarks/v1')
export class RemarksController {
  constructor(private readonly remarks: RemarksService) {}

  @Get()
  @HasRole('ADMIN')
  @ApiPaginated()
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ status: HttpStatus.OK, type: ListedRemarksDto })
  listRemarks(
    @QueryPagination() pagination: Pagination,
    @Query() query: ListRemarksQueryDto,
  ): Promise<ListedRemarksDto> {
    return this.remarks.listRemarks({
      pagination,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      statuses: query.statuses ?? [],
    });
  }

  @Post()
  @HasRole()
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  sendRemark(
    @AuthedUser() user: { id: string; impersonation?: { impersonatorId: string } },
    @Body() remark: SendRemarkDto,
  ): Promise<void> {
    return this.remarks.sendRemark({
      ...remark,
      sender: { id: user.id, impersonatorId: user.impersonation?.impersonatorId ?? null },
    });
  }

  @Put('/:remarkId/status')
  @HasRole('ADMIN')
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.NO_CONTENT)
  changeRemarkStatus(
    @AuthedUser() user: { id: string },
    @Param('remarkId', ParseUUIDPipe) remarkId: string,
    @Body() body: ChangeRemarkStatusDto,
  ): Promise<void> {
    return this.remarks.changeRemarkStatus({
      changedBy: user.id,
      remarkId,
      status: { comment: body.comment, value: body.status },
    });
  }
}
