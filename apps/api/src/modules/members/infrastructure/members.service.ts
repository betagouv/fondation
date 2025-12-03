import { Injectable } from '@nestjs/common';
import { Magistrat } from 'shared-models';
import { Paginated, Pagination } from 'src/modules/framework/pagination';
import { MemberRepository } from './member-repository';
import {
  DetailedMemberDto,
  DetailsMemberQuery,
} from './queries/details-member.query';
import { InternalFindMembersQuery } from './queries/internal-find-members.query';
import {
  ListMembersQuery,
  MemberListItemDto,
} from './queries/list-members.query';
import { InternalFindMembersByFullNameQuery } from './queries/internal-find-members-by-full-name.query';

@Injectable()
export class MembersService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly listMembersQuery: ListMembersQuery,
    private readonly detailsMemberQuery: DetailsMemberQuery,
    private readonly internalFindMembersQuery: InternalFindMembersQuery,
    private readonly internalFindMembersByFullName: InternalFindMembersByFullNameQuery,
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
    ids: readonly string[] | undefined;
    formation: Magistrat.Formation | undefined;
  }): Promise<string[]> {
    return this.internalFindMembersQuery.handle(query);
  }

  /** @internal */
  findMembersByFullName(query: {
    formation: Magistrat.Formation | undefined;
    fullNames: readonly string[];
  }): Promise<
    { fullName: string; id: string; firstName: string; lastName: string }[]
  > {
    return this.internalFindMembersByFullName.handle(query);
  }
}
