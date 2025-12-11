import { Module, forwardRef } from '@nestjs/common';

import { MembersModule } from '../members';

import { FilesModule } from '../framework/files';
import { AffectationVersionFinder } from './infrastructure/finders/affectation-version.finder';
import { AutoAffectationsFinder } from './infrastructure/finders/auto-affectations.finder';
import { NominationSessionFileFinder } from './infrastructure/finders/nomination-session-file.finder';
import { DetailNominationSessionAffectationVersionQuery } from './infrastructure/queries/detail-nomination-session-affectation-version.query';
import { DetailNominationSessionAttachmentQuery } from './infrastructure/queries/detail-nomination-session-attachment.query';
import { DetailNominationSessionQuery } from './infrastructure/queries/detail-nomination-session.query';
import { InternalDetailMemberSessionQuery } from './infrastructure/queries/internal-detail-member-session.query';
import { GetNominationFileWithCommentQuery } from './infrastructure/queries/get-nomination-file-with-comment.query';
import { ListNominationFilesQuery } from './infrastructure/queries/list-nomination-files.query';
import { ListNominationSessionAttachmentsQuery } from './infrastructure/queries/list-nomination-session-attachments.query';
import { InternalListMemberSessionsQuery } from './infrastructure/queries/internal-list-member-sessions.query';
import { NominationSessionRepository } from './infrastructure/repositories/nomination-session.repository';
import { SessionService } from './infrastructure/sessions.service';
import { SessionController } from './session.controller';
import { ListNominationSessionsQuery } from './infrastructure/queries/list-nomination-sessions.query';

@Module({
  exports: [SessionService],
  controllers: [SessionController],
  imports: [
    forwardRef(() => MembersModule),
    FilesModule.forFeature('nominations'),
  ],
  providers: [
    AffectationVersionFinder,
    AutoAffectationsFinder,
    InternalDetailMemberSessionQuery,
    DetailNominationSessionAffectationVersionQuery,
    DetailNominationSessionAttachmentQuery,
    DetailNominationSessionQuery,
    InternalListMemberSessionsQuery,
    GetNominationFileWithCommentQuery,
    ListNominationFilesQuery,
    ListNominationSessionAttachmentsQuery,
    ListNominationSessionsQuery,
    NominationSessionFileFinder,
    NominationSessionRepository,
    SessionService,
  ],
})
export class SessionModule {}
