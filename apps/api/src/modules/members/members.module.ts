import { Module } from '@nestjs/common';

import { ApiClientsModule } from '../api-clients';

import { ExcludedJurisdictionsFinder } from './infrastructure/finders/excluded-jurisdictions.finder';
import { JurisdictionsService } from './infrastructure/jurisdictions.service';
import { MemberRepository } from './infrastructure/member-repository';
import { MembersService } from './infrastructure/members.service';
import { DetailsMemberQuery } from './infrastructure/queries/details-member.query';
import { FindMagistratStatusQuery } from './infrastructure/queries/find-magistrat-status.query';
import { IdentifyMagistratQuery } from './infrastructure/queries/identify-magistrat.query';
import { InternalFindMembersByFormationQuery } from './infrastructure/queries/internal-find-members-by-formation.query';
import { InternalFindMembersByFullNameQuery } from './infrastructure/queries/internal-find-members-by-full-name.query';
import { InternalFindMembersQuery } from './infrastructure/queries/internal-find-members.query';
import { InternalGetMemberQuery } from './infrastructure/queries/internal-get-member.query';
import { ListMembersQuery } from './infrastructure/queries/list-members.query';
import { SearchJurisdictionsQuery } from './infrastructure/queries/search-jurisdictions.query';
import { JurisdictionsController } from './jurisdictions.controller';
import { MagistratPublicController } from './magistrat.public.controller';
import { MembersController } from './members.controller';

@Module({
  controllers: [MembersController, JurisdictionsController, MagistratPublicController],
  exports: [MembersService],
  imports: [ApiClientsModule],
  providers: [
    DetailsMemberQuery,
    ExcludedJurisdictionsFinder,
    FindMagistratStatusQuery,
    IdentifyMagistratQuery,
    InternalFindMembersByFormationQuery,
    InternalFindMembersByFullNameQuery,
    InternalFindMembersQuery,
    InternalGetMemberQuery,
    JurisdictionsService,
    ListMembersQuery,
    MemberRepository,
    MembersService,
    SearchJurisdictionsQuery,
  ],
})
export class MembersModule {}
