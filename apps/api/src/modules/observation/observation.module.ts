import { Module } from '@nestjs/common';

import { GetObservationFileUrlQuery } from './infrastructure/queries/get-observation-file-url.query';
import { ListObservationsQuery } from './infrastructure/queries/list-observations.query';
import { SearchMagistratsQuery } from './infrastructure/queries/search-magistrats.query';
import { ObservationRepository } from './infrastructure/repositories/observation.repository';
import { ObservationController } from './observation.controller';
import { ObservationService } from './observation.service';

@Module({
  controllers: [ObservationController],
  exports: [ObservationService],
  providers: [
    ObservationRepository,
    ObservationService,
    GetObservationFileUrlQuery,
    ListObservationsQuery,
    SearchMagistratsQuery,
  ],
})
export class ObservationModule {}
