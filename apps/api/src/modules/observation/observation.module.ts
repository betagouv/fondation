import { Module } from '@nestjs/common';

import { SessionModule } from '../session/session.module';
import { MagistratService } from './infrastructure/magistrat.service';
import { GetObservationDetailsQuery } from './infrastructure/queries/get-observation-details.query';
import { GetObservationFileUrlQuery } from './infrastructure/queries/get-observation-file-url.query';
import { ListObservationsQuery } from './infrastructure/queries/list-observations.query';
import { SearchMagistratsQuery } from './infrastructure/queries/search-magistrats.query';
import { ObservationRepository } from './infrastructure/repositories/observation.repository';
import { MagistratController } from './magistrat.controller';
import { ObservationController } from './observation.controller';
import { ObservationService } from './observation.service';

@Module({
  imports: [SessionModule],
  controllers: [ObservationController, MagistratController],
  exports: [ObservationService, MagistratService],
  providers: [
    GetObservationDetailsQuery,
    GetObservationFileUrlQuery,
    ListObservationsQuery,
    MagistratService,
    ObservationRepository,
    ObservationService,
    SearchMagistratsQuery,
  ],
})
export class ObservationModule {}
