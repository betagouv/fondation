import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';

import { Role, TypeDeSaisine } from 'shared-models';

import {
  Paginated,
  Pagination,
  QueryPagination,
} from 'src/modules/framework/pagination';
import { AuthedUser, HasRole } from 'src/modules/simple-auth';
import { SessionService } from 'src/modules/session';

import { MembersService } from './infrastructure/members.service';
import { DetailedMemberDto } from './infrastructure/queries/details-member.query';
import { MemberListItemDto } from './infrastructure/queries/list-members.query';
import { ExcludeJurisdictionsDto } from './infrastructure/member.dto';

@Controller('/api/members/v1')
export class MembersController {
  constructor(
    private readonly members: MembersService,
    private readonly sessions: SessionService,
  ) {}

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get()
  listMembers(
    @QueryPagination() pagination: Pagination,
    @Query('search') search: string | undefined,
  ): Promise<Paginated<MemberListItemDto>> {
    return this.members.listMembers({ pagination, search });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get('/:userId')
  detailsMember(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<DetailedMemberDto> {
    return this.members.detailsMember({ userId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Put('/:userId/excluded-jurisdictions')
  excludeJurisdictions(
    @Param('userId') userId: string,
    @Body() { jurisdictionIds }: ExcludeJurisdictionsDto,
  ): Promise<void> {
    return this.members.excludeJurisdictions({ userId, jurisdictionIds });
  }

  @HasRole()
  @Get('/:userId/sessions/transparence/garde-des-sceaux')
  listMemberSessions(
    @Param('userId') userId: string,
    @AuthedUser() authUser: { id: string; role: Role },
  ) {
    if (userId !== authUser.id) throw new ForbiddenException();

    return this.sessions.listMemberSessions({
      user: authUser,
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
    });
  }

  @HasRole()
  @Get('/:userId/sessions/transparence/garde-des-sceaux/:sessionId')
  detailsMemberSession(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @AuthedUser() authUser: { id: string; role: Role },
  ) {
    if (userId !== authUser.id) throw new ForbiddenException();

    return this.sessions.detailMemberSession({
      user: authUser,
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
      sessionId,
    });
  }
}
