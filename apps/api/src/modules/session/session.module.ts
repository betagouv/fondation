import { Module, forwardRef } from '@nestjs/common';

import { MembersModule } from '../members';

import { AffectationVersionFinder } from './infrastructure/finders/affectation-version.finder';
import { AutoAffectationsFinder } from './infrastructure/finders/auto-affectations.finder';
import { NominationSessionFileFinder } from './infrastructure/finders/nomination-session-file.finder';
import { UnaffectedFilesFinder } from './infrastructure/finders/unaffected-files.finder';
import { CountUnaffectedFilesQuery } from './infrastructure/queries/count-unaffected-files.query';
import { DetailNominationSessionAffectationVersionQuery } from './infrastructure/queries/detail-nomination-session-affectation-version.query';
import { DetailNominationSessionAttachmentQuery } from './infrastructure/queries/detail-nomination-session-attachment.query';
import { DetailNominationSessionQuery } from './infrastructure/queries/detail-nomination-session.query';
import { GetLolfiMagistratUrlQuery } from './infrastructure/queries/get-lolfi-magistrat-url.query';
import { GetNominationFileWithCommentQuery } from './infrastructure/queries/get-nomination-file-with-comment.query';
import { InternalDetailMemberSessionQuery } from './infrastructure/queries/internal-detail-member-session.query';
import { InternalListMemberSessionsQuery } from './infrastructure/queries/internal-list-member-sessions.query';
import { ListCurrentlyAffectedReportersQuery } from './infrastructure/queries/list-currently-affected-reporters.query';
import { ListNominationFilesQuery } from './infrastructure/queries/list-nomination-files.query';
import { ListNominationSessionAttachmentsQuery } from './infrastructure/queries/list-nomination-session-attachments.query';
import { ListNominationSessionsQuery } from './infrastructure/queries/list-nomination-sessions.query';
import { NominationSessionRepository } from './infrastructure/repositories/nomination-session.repository';
import { SessionService } from './infrastructure/sessions.service';
import { SessionController } from './session.controller';
import { SummaryModule } from './summary.module';
import { ListNominationFilesAsExcelQuery } from './infrastructure/queries/list-nomination-files-as-excel.query';

@Module({
  exports: [SessionService, SummaryModule, AffectationVersionFinder],
  controllers: [SessionController],
  imports: [forwardRef(() => MembersModule), SummaryModule],
  providers: [
    AffectationVersionFinder,
    AutoAffectationsFinder,
    CountUnaffectedFilesQuery,
    DetailNominationSessionAffectationVersionQuery,
    DetailNominationSessionAttachmentQuery,
    DetailNominationSessionQuery,
    GetLolfiMagistratUrlQuery,
    GetNominationFileWithCommentQuery,
    InternalDetailMemberSessionQuery,
    InternalListMemberSessionsQuery,
    ListCurrentlyAffectedReportersQuery,
    ListNominationFilesAsExcelQuery,
    ListNominationFilesQuery,
    ListNominationSessionAttachmentsQuery,
    ListNominationSessionsQuery,
    NominationSessionFileFinder,
    NominationSessionRepository,
    UnaffectedFilesFinder,
    SessionService,
  ],
})
export class SessionModule {}
