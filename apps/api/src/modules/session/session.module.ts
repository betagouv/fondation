import { Module } from '@nestjs/common';

import { MembersModule } from '../members';

import { AffectationVersionFinder } from './infrastructure/finders/affectation-version.finder';
import { AutoAffectationsFinder } from './infrastructure/finders/auto-affectations.finder';
import { DetailNominationSessionAffectationVersionQuery } from './infrastructure/queries/detail-nomination-session-affectation-version.query';
import { DetailSessionQuery } from './infrastructure/queries/detail-session.query';
import { GetCommentAccessQuery } from './infrastructure/queries/get-comment-access.query';
import { ListNominationFilesQuery } from './infrastructure/queries/list-nomination-files.query';
import { ListSessionOfTypeGardeDesSceauxQuery } from './infrastructure/queries/list-sessions-of-type-garde-des-sceaux.query';
import { NominationSessionRepository } from './infrastructure/repositories/nomination-session.repository';
import { SessionController } from './session.controller';
import { SessionService } from './infrastructure/sessions.service';

@Module({
  controllers: [SessionController],
  imports: [MembersModule],
  providers: [
    AutoAffectationsFinder,
    AffectationVersionFinder,
    DetailNominationSessionAffectationVersionQuery,
    DetailSessionQuery,
    GetCommentAccessQuery,
    ListNominationFilesQuery,
    ListSessionOfTypeGardeDesSceauxQuery,
    NominationSessionRepository,
    SessionService,
  ],
})
export class SessionModule {}
