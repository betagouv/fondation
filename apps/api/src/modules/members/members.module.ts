import { forwardRef, Module } from '@nestjs/common';
import { SessionModule } from '../session/session.module';
import { JurisdictionsService } from './infrastructure/jurisdictions.service';
import { MemberRepository } from './infrastructure/member-repository';
import { MembersService } from './infrastructure/members.service';
import { DetailsMemberQuery } from './infrastructure/queries/details-member.query';
import { InternalFindMembersByFullNameQuery } from './infrastructure/queries/internal-find-members-by-full-name.query';
import { InternalFindMembersByIdsQuery } from './infrastructure/queries/internal-find-members-by-ids.query';
import { InternalFindMembersQuery } from './infrastructure/queries/internal-find-members.query';
import { InternalGetMemberQuery } from './infrastructure/queries/internal-get-member.query';
import { ListMembersQuery } from './infrastructure/queries/list-members.query';
import { SearchJurisdictionsQuery } from './infrastructure/queries/search-jurisdictions.query';
import { JurisdictionsController } from './jurisdictions.controller';
import { MembersController } from './members.controller';

@Module({
  imports: [forwardRef(() => SessionModule)],
  controllers: [MembersController, JurisdictionsController],
  exports: [MembersService],
  providers: [
    DetailsMemberQuery,
    InternalFindMembersByFullNameQuery,
    InternalFindMembersByIdsQuery,
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
