import {
  Body,
  Controller,
  ForbiddenException,
  forwardRef,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { DetailedMemberSessionDto } from '../session/transparence/infrastructure/queries/internal-detail-member-session.query';
import { ListedMemberSessionsDto } from '../session/transparence/infrastructure/queries/internal-list-member-sessions.query';
import { ApiPaginated, Pagination, QueryPagination } from 'src/modules/framework/pagination';
import { FoundNominationFileMembersReportDto } from 'src/modules/report/infrastructure/queries/search-nomination-file-members-report.query';
import { ReportService } from 'src/modules/report/report.service';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { AuthedUser, HasRole } from 'src/modules/simple-auth';

import {
  DetailsMemberSessionQueryDto,
  ListMembersQueryDto,
  WriteNominationFileMemberMemoDto,
} from './infrastructure/dtos/members.dto';
import {
  ExcludeJurisdictionsDto,
  UpdateMemberDisplayTitleDto,
  UpdateMemberTitleDto,
} from './infrastructure/member.dto';
import { MembersService } from './infrastructure/members.service';
import { DetailedMemberDto } from './infrastructure/queries/details-member.query';
import { PaginatedMemberListItemDto } from './infrastructure/queries/list-members.query';

@Controller('/api/members/v1')
export class MembersController {
  constructor(
    private readonly members: MembersService,
    private readonly reports: ReportService,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Get()
  @ApiPaginated()
  @UsePipes(ZodValidationPipe)
  @ZodResponse({ type: PaginatedMemberListItemDto, status: HttpStatus.OK })
  listMembers(
    @QueryPagination()
    pagination: Pagination,
    @Query() query: ListMembersQueryDto,
  ): Promise<PaginatedMemberListItemDto> {
    return this.members.listMembers({
      pagination,
      formations: query.formations,
      search: query.search,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
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
  @Put('/:userId/display-title')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  updateDisplayTitle(
    @Param('userId') userId: string,
    @Body() { displayTitle }: UpdateMemberDisplayTitleDto,
  ): Promise<void> {
    return this.members.updateDisplayTitle({ userId, displayTitle });
  }

  @HasRole('ADJOINT_SECRETAIRE_GENERAL')
  @Put('/:userId/title')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  updateTitle(@Param('userId') userId: string, @Body() { title }: UpdateMemberTitleDto): Promise<void> {
    return this.members.updateTitle({ userId, title });
  }

  @HasRole()
  @Get('/:userId/sessions/transparence/garde-des-sceaux')
  @ZodResponse({ type: ListedMemberSessionsDto, status: HttpStatus.OK })
  listMemberSessions(
    @Param('userId') userId: string,
    @AuthedUser() authUser: { id: string; role: RoleEnum },
  ): Promise<ListedMemberSessionsDto> {
    if (userId !== authUser.id) throw new ForbiddenException();

    return this.sessions.listMemberSessions({
      user: authUser,
      typeDeSaisine: 'TRANSPARENCE_GDS',
    });
  }

  @HasRole()
  @ApiPaginated()
  @Get('/:userId/sessions/transparence/garde-des-sceaux/:sessionId')
  @ZodResponse({ type: DetailedMemberSessionDto, status: HttpStatus.OK })
  detailsMemberSession(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @QueryPagination() pagination: Pagination,
    @Query(ZodValidationPipe) query: DetailsMemberSessionQueryDto,
    @AuthedUser() authUser: { id: string; role: RoleEnum },
  ): Promise<DetailedMemberSessionDto> {
    if (userId !== authUser.id) throw new ForbiddenException();

    return this.sessions.detailMemberSession({
      user: authUser,
      priorities: query.priorities,
      status: query.status ?? undefined,
      sorting: { sortBy: query.sortBy, sortDesc: query.sortDesc },
      typeDeSaisine: 'TRANSPARENCE_GDS',
      pagination,
      sessionId,
    });
  }

  @HasRole()
  @Get('/:userId/sessions/transparence/garde-des-sceaux/:sessionId/files/:nominationFileId/reports')
  @ZodResponse({ type: FoundNominationFileMembersReportDto, status: HttpStatus.OK })
  searchNominationFileMembersReport(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @AuthedUser() authUser: { id: string },
  ): Promise<FoundNominationFileMembersReportDto> {
    if (userId !== authUser.id) throw new ForbiddenException();

    return this.reports.internalSearchNominationFileMembersReport({
      nominationFileId,
      sessionId,
      userId,
    });
  }

  @HasRole()
  @Put('/:userId/sessions/transparence/garde-des-sceaux/:sessionId/files/:nominationFileId/memo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async writeNominationFileMemberMemo(
    @AuthedUser() authedUser: { id: string },
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @Param('nominationFileId') nominationFileId: string,
    @Body() { memo }: WriteNominationFileMemberMemoDto,
  ) {
    if (authedUser.id !== userId) throw new ForbiddenException();

    await this.sessions.writeNominationFileMemberMemo({
      userId,
      sessionId,
      nominationFileId,
      memo,
    });
  }
}
