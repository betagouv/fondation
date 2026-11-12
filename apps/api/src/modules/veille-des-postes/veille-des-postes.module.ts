import { Module } from '@nestjs/common';

import { ListCourtOfAppealFirstPresidentsQuery } from './infrastructure/queries/list-court-of-appeal-first-presidents.query';
import { ListCourtOfCassationHoldersQuery } from './infrastructure/queries/list-court-of-cassation-holders.query';
import { VeilleDesPostesController } from './veille-des-postes.controller';
import { VeilleDesPostesService } from './veille-des-postes.service';

@Module({
  controllers: [VeilleDesPostesController],
  providers: [
    ListCourtOfAppealFirstPresidentsQuery,
    ListCourtOfCassationHoldersQuery,
    VeilleDesPostesService,
  ],
})
export class VeilleDesPostesModule {}
