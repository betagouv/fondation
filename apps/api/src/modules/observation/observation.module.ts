import { Module } from '@nestjs/common';

import { ObservationRepository } from './infrastructure/repositories/observation.repository';
import { ListObservationsQuery } from './infrastructure/queries/list-observations.query';
import { SearchMagistratsQuery } from './infrastructure/queries/search-magistrats.query';
import { ObservationController } from './observation.controller';
import { ObservationService } from './observation.service';

@Module({
  controllers: [ObservationController],
  exports: [ObservationService],
  providers: [
    ObservationRepository,
    ObservationService,
    ListObservationsQuery,
    SearchMagistratsQuery,
  ],
})
export class ObservationModule {}
