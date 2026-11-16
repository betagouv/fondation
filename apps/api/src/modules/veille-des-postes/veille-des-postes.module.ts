import { forwardRef, Module } from '@nestjs/common';

import { TransparenceModule } from '../session/transparence/transparence.module';

import { HeldPositionFinder } from './infrastructure/finders/held-position.finder';
import { HolderProposalsFinder } from './infrastructure/finders/holder-proposals.finder';
import { FindPositionVacancyQuery } from './infrastructure/queries/find-position-vacancy.query';
import { ListCourtOfAppealFirstPresidentsQuery } from './infrastructure/queries/list-court-of-appeal-first-presidents.query';
import { ListCourtOfCassationHoldersQuery } from './infrastructure/queries/list-court-of-cassation-holders.query';
import { ListJudicialCourtPresidentsQuery } from './infrastructure/queries/list-judicial-court-presidents.query';
import { OpenPositionVacancyAttachmentQuery } from './infrastructure/queries/open-position-vacancy-attachment.query';
import { PositionVacancyRepository } from './infrastructure/repositories/position-vacancy.repository';
import { VeilleDesPostesController } from './veille-des-postes.controller';
import { VeilleDesPostesService } from './veille-des-postes.service';

@Module({
  controllers: [VeilleDesPostesController],
  // the LOLFI import deletes the lapsed vacancies through the repository: the service would bring the queries
  // that reach the sessions, which import the LOLFI import, and the circle leaves a class undefined at boot
  exports: [PositionVacancyRepository],
  imports: [forwardRef(() => TransparenceModule)],
  providers: [
    FindPositionVacancyQuery,
    HeldPositionFinder,
    HolderProposalsFinder,
    ListCourtOfAppealFirstPresidentsQuery,
    ListCourtOfCassationHoldersQuery,
    ListJudicialCourtPresidentsQuery,
    OpenPositionVacancyAttachmentQuery,
    PositionVacancyRepository,
    VeilleDesPostesService,
  ],
})
export class VeilleDesPostesModule {}
