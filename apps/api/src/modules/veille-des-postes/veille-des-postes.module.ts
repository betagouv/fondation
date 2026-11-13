import { Module } from '@nestjs/common';

import { TransparenceModule } from '../session/transparence/transparence.module';

import { HolderProposalsFinder } from './infrastructure/finders/holder-proposals.finder';
import { ListCourtOfAppealFirstPresidentsQuery } from './infrastructure/queries/list-court-of-appeal-first-presidents.query';
import { ListCourtOfCassationHoldersQuery } from './infrastructure/queries/list-court-of-cassation-holders.query';
import { ListJudicialCourtPresidentsQuery } from './infrastructure/queries/list-judicial-court-presidents.query';
import { VeilleDesPostesController } from './veille-des-postes.controller';
import { VeilleDesPostesService } from './veille-des-postes.service';

@Module({
  controllers: [VeilleDesPostesController],
  imports: [TransparenceModule],
  providers: [
    HolderProposalsFinder,
    ListCourtOfAppealFirstPresidentsQuery,
    ListCourtOfCassationHoldersQuery,
    ListJudicialCourtPresidentsQuery,
    VeilleDesPostesService,
  ],
})
export class VeilleDesPostesModule {}
