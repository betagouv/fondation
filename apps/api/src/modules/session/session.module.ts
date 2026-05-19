import { Module, forwardRef } from '@nestjs/common';

import { DocsModule } from '../docs/docs.module';
import { IngestModule } from '../ingest/ingest.module';
import { MembersModule } from '../members';

import { AffectationVersionFinder } from './infrastructure/finders/affectation-version.finder';
import { AutoAffectationsFinder } from './infrastructure/finders/auto-affectations.finder';
import { LolfiNominationFilesFinder } from './infrastructure/finders/lolfi-nomination-files.finder';
import { LolfiNominationSessionFinder } from './infrastructure/finders/lolfi-nomination-session.finder';
import { NominationSessionFileFinder } from './infrastructure/finders/nomination-session-file.finder';
import { NominationSessionFinder } from './infrastructure/finders/nomination-session.finder';
import { UnaffectedFilesFinder } from './infrastructure/finders/unaffected-files.finder';
import { CountNominationFilesByStatusQuery } from './infrastructure/queries/count-nomination-files-by-status.query';
import { CountUnaffectedFilesQuery } from './infrastructure/queries/count-unaffected-files.query';
import { CountUsersNewSessionsQuery } from './infrastructure/queries/count-users-new-sessions.query';
import { DetailNominationSessionAffectationVersionQuery } from './infrastructure/queries/detail-nomination-session-affectation-version.query';
import { DetailNominationSessionAttachmentQuery } from './infrastructure/queries/detail-nomination-session-attachment.query';
import { DetailNominationSessionQuery } from './infrastructure/queries/detail-nomination-session.query';
import { GetLolfiMagistratUrlQuery } from './infrastructure/queries/get-lolfi-magistrat-url.query';
import { InternalDetailMemberSessionQuery } from './infrastructure/queries/internal-detail-member-session.query';
import { InternalFindDocsNominationFilesQuery } from './infrastructure/queries/internal-find-docs-nomination-files.query';
import { InternalListMemberSessionsQuery } from './infrastructure/queries/internal-list-member-sessions.query';
import { ListCurrentlyAffectedReportersQuery } from './infrastructure/queries/list-currently-affected-reporters.query';
import { ListNominationFilesAsExcelQuery } from './infrastructure/queries/list-nomination-files-as-excel.query';
import { ListNominationFilesQuery } from './infrastructure/queries/list-nomination-files.query';
import { ListNominationSessionAttachmentsQuery } from './infrastructure/queries/list-nomination-session-attachments.query';
import { ListNominationSessionsQuery } from './infrastructure/queries/list-nomination-sessions.query';
import { NominationSessionRepository } from './infrastructure/repositories/nomination-session.repository';
import { SessionTestController } from './infrastructure/session.test-controller';
import { SessionService } from './infrastructure/sessions.service';
import { SessionsTestService } from './infrastructure/sessions.test-service';
import { SessionController } from './session.controller';
import { SummaryModule } from './summary.module';

@Module({
  exports: [SessionService, SummaryModule, AffectationVersionFinder],
  controllers: [SessionController, SessionTestController],
  imports: [
    SummaryModule,
    forwardRef(() => MembersModule),
    forwardRef(() => IngestModule),
    forwardRef(() => DocsModule),
  ],
  providers: [
    AffectationVersionFinder,
    AutoAffectationsFinder,
    CountNominationFilesByStatusQuery,
    CountUnaffectedFilesQuery,
    CountUsersNewSessionsQuery,
    DetailNominationSessionAffectationVersionQuery,
    DetailNominationSessionAttachmentQuery,
    DetailNominationSessionQuery,
    GetLolfiMagistratUrlQuery,
    InternalDetailMemberSessionQuery,
    InternalFindDocsNominationFilesQuery,
    InternalListMemberSessionsQuery,
    ListCurrentlyAffectedReportersQuery,
    ListNominationFilesAsExcelQuery,
    ListNominationFilesQuery,
    ListNominationSessionAttachmentsQuery,
    ListNominationSessionsQuery,
    LolfiNominationFilesFinder,
    LolfiNominationSessionFinder,
    NominationSessionFileFinder,
    NominationSessionFinder,
    NominationSessionRepository,
    SessionService,
    UnaffectedFilesFinder,

    SessionsTestService,
  ],
})
export class SessionModule {}
