import { Module } from '@nestjs/common';

import { MembersModule } from '../members';

import { AffectationVersionFinder } from './infrastructure/finders/affectation-version.finder';
import { DetailNominationSessionAffectationVersionQuery } from './infrastructure/queries/detail-nomination-session-affectation-version.query';
import { DetailSessionQuery } from './infrastructure/queries/detail-session.query';
import { ListNominationFilesQuery } from './infrastructure/queries/list-nomination-files.query';
import { ListSessionOfTypeGardeDesSceauxQuery } from './infrastructure/queries/list-sessions-of-type-garde-des-sceaux.query';
import { NominationSessionRepository } from './infrastructure/repositories/nomination-session.repository';
import { SessionService } from './infrastructure/sessions.service';
import { SessionController } from './session.controller';

@Module({
  controllers: [SessionController],
  imports: [MembersModule],
  providers: [
    AffectationVersionFinder,
    DetailNominationSessionAffectationVersionQuery,
    DetailSessionQuery,
    ListNominationFilesQuery,
    ListSessionOfTypeGardeDesSceauxQuery,
    NominationSessionRepository,
    SessionService,
  ],
})
export class SessionModule {}
