import { Module } from '@nestjs/common';
import { JurisdictionsService } from './infrastructure/jurisdictions.service';
import { MemberRepository } from './infrastructure/member-repository';
import { MembersService } from './infrastructure/members.service';
import { DetailsMemberQuery } from './infrastructure/queries/details-member.query';
import { ListMembersQuery } from './infrastructure/queries/list-members.query';
import { SearchJurisdictionsQuery } from './infrastructure/queries/search-jurisdictions.query';
import { JurisdictionsController } from './jurisdictions.controller';
import { MembersController } from './members.controller';
import { InternalFindMembersQuery } from './infrastructure/queries/internal-find-members.query';
import { InternalFindMembersByFullNameQuery } from './infrastructure/queries/internal-find-members-by-full-name.query';

@Module({
  controllers: [MembersController, JurisdictionsController],
  exports: [MembersService],
  providers: [
    DetailsMemberQuery,
    InternalFindMembersQuery,
    JurisdictionsService,
    ListMembersQuery,
    MemberRepository,
    MembersService,
    SearchJurisdictionsQuery,
    InternalFindMembersByFullNameQuery,
  ],
})
export class MembersModule {}
