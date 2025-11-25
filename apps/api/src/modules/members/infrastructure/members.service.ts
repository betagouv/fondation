import { Injectable } from '@nestjs/common';
import { Paginated, Pagination } from 'src/modules/framework/pagination';
import {
  ListMembersQuery,
  MemberListItemDto,
} from './queries/list-members.query';
import {
  DetailedMemberDto,
  DetailsMemberQuery,
} from './queries/details-member.query';
import { MemberRepository } from './member-repository';
import { InternalFindMembersQuery } from './queries/internal-find-members.query';
import { Magistrat } from 'shared-models';

@Injectable()
export class MembersService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly listMembersQuery: ListMembersQuery,
    private readonly detailsMemberQuery: DetailsMemberQuery,
    private readonly internalFindMembersQuery: InternalFindMembersQuery,
  ) {}

  listMembers(query: {
    pagination: Pagination;
    search: string | undefined;
  }): Promise<Paginated<MemberListItemDto>> {
    return this.listMembersQuery.handle(query);
  }

  detailsMember(query: { userId: string }): Promise<DetailedMemberDto> {
    return this.detailsMemberQuery.handle(query);
  }

  async excludeJurisdictions(command: {
    userId: string;
    jurisdictionIds: readonly string[];
  }) {
    const member = await this.memberRepository.findWithJurisdictions(command);
    member.excludeJurisdictions(command.jurisdictionIds);
    await this.memberRepository.persist(member);
  }

  /** @internal */
  findMembers(query: {
    ids: readonly string[];
    formation: Magistrat.Formation | undefined;
  }): Promise<string[]> {
    return this.internalFindMembersQuery.handle(query);
  }
}
