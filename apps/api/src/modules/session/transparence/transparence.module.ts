import { Module, forwardRef } from '@nestjs/common';

import { SummaryModule } from '../summaries/summary.module';
import { DocsModule } from 'src/modules/docs/docs.module';
import { IngestModule } from 'src/modules/ingest/ingest.module';
import { MembersModule } from 'src/modules/members';

import { AffectationVersionFinder } from './infrastructure/finders/affectation-version.finder';
import { AutoAffectationsFinder } from './infrastructure/finders/auto-affectations.finder';
import { HydratedNominationFilesFinder } from './infrastructure/finders/hydrated-nomination-files.finder';
import { LolfiTransparenceFilesFinder } from './infrastructure/finders/lolfi-nomination-files.finder';
import { LolfiNominationSessionFinder } from './infrastructure/finders/lolfi-nomination-session.finder';
import { NominationFileJurisdictionsFinder } from './infrastructure/finders/nomination-file-jurisdictions.finder';
import { TransparenceFilesFinder } from './infrastructure/finders/transparence-files.finder';
import { NominationSessionFinder } from './infrastructure/finders/transparence-session.finder';
import { UnaffectedFilesFinder } from './infrastructure/finders/unaffected-files.finder';
import { UnreportedSessionFilesCountFinder } from './infrastructure/finders/unreported-transparence-files-count.finder';
import { CountNominationFilesByStatusQuery } from './infrastructure/queries/count-nomination-files-by-status.query';
import { CountUnaffectedFilesQuery } from './infrastructure/queries/count-unaffected-files.query';
import { CountUsersNewSessionsQuery } from './infrastructure/queries/count-users-new-sessions.query';
import { DetailNominationFileAttachmentQuery } from './infrastructure/queries/detail-nomination-file-attachment.query';
import { DetailNominationSessionAffectationVersionQuery } from './infrastructure/queries/detail-nomination-session-affectation-version.query';
import { DetailNominationSessionAttachmentQuery } from './infrastructure/queries/detail-nomination-session-attachment.query';
import { DetailNominationSessionQuery } from './infrastructure/queries/detail-nomination-session.query';
import { GetLolfiMagistratUrlQuery } from './infrastructure/queries/get-lolfi-magistrat-url.query';
import { InternalDetailMemberSessionQuery } from './infrastructure/queries/internal-detail-member-session.query';
import { InternalFindDocsNominationFilesQuery } from './infrastructure/queries/internal-find-docs-nomination-files.query';
import { InternalListMagistratNominationFilesQuery } from './infrastructure/queries/internal-list-magistrat-nomination-files.query';
import { InternalListMemberSessionsQuery } from './infrastructure/queries/internal-list-member-sessions.query';
import { ListCurrentlyAffectedReportersQuery } from './infrastructure/queries/list-currently-affected-reporters.query';
import { ListNominationFileAttachmentsQuery } from './infrastructure/queries/list-nomination-file-attachments.query';
import { ListNominationFilesAsExcelQuery } from './infrastructure/queries/list-nomination-files-as-excel.query';
import { ListNominationFilesQuery } from './infrastructure/queries/list-nomination-files.query';
import { ListNominationSessionAttachmentsQuery } from './infrastructure/queries/list-nomination-session-attachments.query';
import { SessionTransparenceRepository } from './infrastructure/repositories/session-transparence.repository';
import { TransparenceService } from './infrastructure/transparence.service';
import { SessionController } from './transparence.controller';

@Module({
  exports: [TransparenceService, SummaryModule, AffectationVersionFinder],
  controllers: [SessionController],
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
    DetailNominationFileAttachmentQuery,
    DetailNominationSessionAffectationVersionQuery,
    DetailNominationSessionAttachmentQuery,
    DetailNominationSessionQuery,
    GetLolfiMagistratUrlQuery,
    HydratedNominationFilesFinder,
    InternalDetailMemberSessionQuery,
    InternalFindDocsNominationFilesQuery,
    InternalListMagistratNominationFilesQuery,
    InternalListMemberSessionsQuery,
    ListCurrentlyAffectedReportersQuery,
    ListNominationFileAttachmentsQuery,
    ListNominationFilesAsExcelQuery,
    ListNominationFilesQuery,
    ListNominationSessionAttachmentsQuery,
    LolfiNominationSessionFinder,
    LolfiTransparenceFilesFinder,
    NominationFileJurisdictionsFinder,
    NominationSessionFinder,
    SessionTransparenceRepository,
    TransparenceFilesFinder,
    TransparenceService,
    UnaffectedFilesFinder,
    UnreportedSessionFilesCountFinder,
  ],
})
export class TransparenceModule {}
