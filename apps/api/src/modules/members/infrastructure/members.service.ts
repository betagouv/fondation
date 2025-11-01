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
import { JurisdictionFinder } from './jurisdiction.finder';

@Injectable()
export class MembersService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly jurisdictionFinder: JurisdictionFinder,
    private readonly listMembersQuery: ListMembersQuery,
    private readonly detailsMemberQuery: DetailsMemberQuery,
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
    const member = await this.memberRepository.find(command.userId);
    const jurisdictionIds = await this.jurisdictionFinder.findMany({
      jurisdictionIds: command.jurisdictionIds,
    });

    member.excludeJurisdictions(jurisdictionIds);
    await this.memberRepository.persist(member);
  }
}
