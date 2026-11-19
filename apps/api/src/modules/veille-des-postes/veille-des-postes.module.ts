import { forwardRef, Module } from '@nestjs/common';

import { TransparenceModule } from '../session/transparence/transparence.module';

import { CommentedPositionFinder } from './infrastructure/finders/commented-position.finder';
import { HeldPositionFinder } from './infrastructure/finders/held-position.finder';
import { HolderProposalsFinder } from './infrastructure/finders/holder-proposals.finder';
import { FindPositionCommentQuery } from './infrastructure/queries/find-position-comment.query';
import { FindPositionVacancyQuery } from './infrastructure/queries/find-position-vacancy.query';
import { ListCourtOfAppealFirstPresidentsQuery } from './infrastructure/queries/list-court-of-appeal-first-presidents.query';
import { ListCourtOfCassationHoldersQuery } from './infrastructure/queries/list-court-of-cassation-holders.query';
import { ListJudicialCourtPresidentsQuery } from './infrastructure/queries/list-judicial-court-presidents.query';
import { OpenPositionVacancyAttachmentQuery } from './infrastructure/queries/open-position-vacancy-attachment.query';
import { PositionCommentRepository } from './infrastructure/repositories/position-comment.repository';
import { PositionVacancyRepository } from './infrastructure/repositories/position-vacancy.repository';
import { VeilleDesPostesInternalService } from './veille-des-postes-internal.service';
import { VeilleDesPostesController } from './veille-des-postes.controller';
import { VeilleDesPostesService } from './veille-des-postes.service';

@Module({
  controllers: [VeilleDesPostesController],
  exports: [VeilleDesPostesInternalService],
  imports: [forwardRef(() => TransparenceModule)],
  providers: [
    CommentedPositionFinder,
    FindPositionCommentQuery,
    FindPositionVacancyQuery,
    HeldPositionFinder,
    HolderProposalsFinder,
    ListCourtOfAppealFirstPresidentsQuery,
    ListCourtOfCassationHoldersQuery,
    ListJudicialCourtPresidentsQuery,
    OpenPositionVacancyAttachmentQuery,
    PositionCommentRepository,
    PositionVacancyRepository,
    VeilleDesPostesInternalService,
    VeilleDesPostesService,
  ],
})
export class VeilleDesPostesModule {}
