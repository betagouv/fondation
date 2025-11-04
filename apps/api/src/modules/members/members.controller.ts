import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { Role } from 'shared-models';
import {
  Paginated,
  Pagination,
  QueryPagination,
} from '../framework/pagination';
import { HasRole } from '../simple-auth';
import { MembersService } from './infrastructure/members.service';
import { DetailedMemberDto } from './infrastructure/queries/details-member.query';
import { MemberListItemDto } from './infrastructure/queries/list-members.query';
import { ExcludeJurisdictionsDto } from './infrastructure/member.dto';

@Controller('/api/members/v1')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get()
  listMembers(
    @QueryPagination() pagination: Pagination,
    @Query('search') search: string | undefined,
  ): Promise<Paginated<MemberListItemDto>> {
    return this.members.listMembers({ pagination, search });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Get(':userId')
  detailsMember(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<DetailedMemberDto> {
    return this.members.detailsMember({ userId });
  }

  @HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
  @Put(':userId/excluded-jurisdictions')
  excludeJurisdictions(
    @Param('userId') userId: string,
    @Body() { jurisdictionIds }: ExcludeJurisdictionsDto,
  ): Promise<void> {
    return this.members.excludeJurisdictions({ userId, jurisdictionIds });
  }
}
