import { Module } from '@nestjs/common';
import { JurisdictionsService } from './infrastructure/jurisdictions.service';
import { DetailsMemberQuery } from './infrastructure/queries/details-member.query';
import { ListMembersQuery } from './infrastructure/queries/list-members.query';
import { SearchJurisdictionsQuery } from './infrastructure/queries/search-jurisdictions.query';
import { MembersService } from './infrastructure/members.service';
import { JurisdictionsController } from './jurisdictions.controller';
import { MembersController } from './members.controller';
import { MemberRepository } from './infrastructure/member-repository';
import { JurisdictionFinder } from './infrastructure/jurisdiction.finder';

@Module({
  controllers: [MembersController, JurisdictionsController],
  providers: [
    DetailsMemberQuery,
    JurisdictionFinder,
    JurisdictionsService,
    ListMembersQuery,
    MemberRepository,
    MembersService,
    SearchJurisdictionsQuery,
  ],
})
export class MembersModule {}
