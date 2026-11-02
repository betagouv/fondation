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
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiPaginated, Pagination, QueryPagination } from '../../framework/pagination';
import { AuthedUser, HasRole } from '../../simple-auth';
import { RemarksService } from '../remarks.service';

import { PaginatedRemarkListItemDto } from './queries/list-remarks.query';
import { ChangeRemarkStatusDto, SendRemarkDto } from './remark.dto';

@ApiTags('Remarks')
@Controller('/api/remarks/v1')
export class RemarksController {
  constructor(private readonly remarks: RemarksService) {}

  @Get()
  @HasRole('ADMIN')
  @ApiPaginated()
  @ZodResponse({ status: HttpStatus.OK, type: PaginatedRemarkListItemDto })
  listRemarks(@QueryPagination() pagination: Pagination): Promise<PaginatedRemarkListItemDto> {
    return this.remarks.listRemarks({ pagination });
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
    return this.remarks.changeRemarkStatus({ changedBy: user.id, remarkId, status: body.status });
  }
}
