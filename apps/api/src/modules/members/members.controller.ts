import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { ApiPaginated, Pagination, QueryPagination } from '../framework/pagination';
import { AuthedUser, HasRole } from '../simple-auth';

import { ListMembersQueryDto } from './infrastructure/dtos/members.dto';
import {
  ExcludeJurisdictionsDto,
  ExcludeMagistratsDto,
  UpdateMemberDisplayTitleDto,
} from './infrastructure/member.dto';
import { MembersService } from './infrastructure/members.service';
import { DetailedMemberDto } from './infrastructure/queries/details-member.query';
import { PaginatedMemberListItemDto } from './infrastructure/queries/list-members.query';

@Controller('/api/members/v1')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get()
  @ApiPaginated()
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: PaginatedMemberListItemDto, status: HttpStatus.OK })
  listMembers(
    @QueryPagination()
    pagination: Pagination,
    @Query() query: ListMembersQueryDto,
    @AuthedUser() user: { isAdmin: boolean },
  ): Promise<PaginatedMemberListItemDto> {
    return this.members.listMembers({
      pagination,
      formations: query.formations,
      search: query.search,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      statuses: query.statuses,
      user,
    });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get('/:userId')
  @ZodResponse({ type: DetailedMemberDto, status: HttpStatus.OK })
  detailsMember(@Param('userId', ParseUUIDPipe) userId: string): Promise<DetailedMemberDto> {
    return this.members.detailsMember({ userId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:userId/excluded-jurisdictions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  excludeJurisdictions(
    @Param('userId') userId: string,
    @Body() { jurisdictionIds }: ExcludeJurisdictionsDto,
  ): Promise<void> {
    return this.members.excludeJurisdictions({ userId, jurisdictionIds });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:userId/excluded-magistrats')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  excludeMagistrats(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() { magistratIds }: ExcludeMagistratsDto,
  ): Promise<void> {
    return this.members.excludeMagistrats({ magistratIds, userId });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:userId/display-title')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  updateDisplayTitle(
    @Param('userId') userId: string,
    @Body() { displayTitle }: UpdateMemberDisplayTitleDto,
  ): Promise<void> {
    return this.members.updateDisplayTitle({ userId, displayTitle });
  }
}
