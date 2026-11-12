import { Module } from '@nestjs/common';

import { ListCourtOfCassationHoldersQuery } from './infrastructure/queries/list-court-of-cassation-holders.query';
import { VeilleDesPostesController } from './veille-des-postes.controller';
import { VeilleDesPostesService } from './veille-des-postes.service';

@Module({
  controllers: [VeilleDesPostesController],
  providers: [ListCourtOfCassationHoldersQuery, VeilleDesPostesService],
})
export class VeilleDesPostesModule {}
