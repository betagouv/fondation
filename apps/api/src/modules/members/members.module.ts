import { forwardRef, Module } from '@nestjs/common';

import { ReportModule } from '../report/report.module';
import { TransparenceModule } from '../session/transparence/transparence.module';

import { JurisdictionsService } from './infrastructure/jurisdictions.service';
import { MemberRepository } from './infrastructure/member-repository';
import { MembersService } from './infrastructure/members.service';
import { DetailsMemberQuery } from './infrastructure/queries/details-member.query';
import { InternalFindMembersByFormationQuery } from './infrastructure/queries/internal-find-members-by-formation.query';
import { InternalFindMembersByFullNameQuery } from './infrastructure/queries/internal-find-members-by-full-name.query';
import { InternalFindMembersQuery } from './infrastructure/queries/internal-find-members.query';
import { InternalGetMemberQuery } from './infrastructure/queries/internal-get-member.query';
import { ListMembersQuery } from './infrastructure/queries/list-members.query';
import { SearchJurisdictionsQuery } from './infrastructure/queries/search-jurisdictions.query';
import { SearchMagistratAuthorizationQuery } from './infrastructure/queries/search-magistrat-authorization.query';
import { JurisdictionsController } from './jurisdictions.controller';
import { MagistratPublicController } from './magistrat.public.controller';
import { MembersController } from './members.controller';

@Module({
  imports: [forwardRef(() => TransparenceModule), ReportModule],
  controllers: [MembersController, JurisdictionsController, MagistratPublicController],
  exports: [MembersService],
  providers: [
    DetailsMemberQuery,
    InternalFindMembersByFormationQuery,
    InternalFindMembersByFullNameQuery,
    InternalFindMembersQuery,
    InternalGetMemberQuery,
    JurisdictionsService,
    ListMembersQuery,
    MemberRepository,
    MembersService,
    SearchJurisdictionsQuery,
    SearchMagistratAuthorizationQuery,
  ],
})
export class MembersModule {}
