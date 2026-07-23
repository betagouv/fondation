import { Module } from '@nestjs/common';

import { TransparenceModule } from '../session/transparence/transparence.module';

import { ObservationFinder } from './infrastructure/finders/observation.finder';
import { MagistratService } from './infrastructure/magistrat.service';
import { DetailMagistratQuery } from './infrastructure/queries/detail-magistrat.query';
import { GetObservationDetailsQuery } from './infrastructure/queries/get-observation-details.query';
import { GetObservationFileUrlQuery } from './infrastructure/queries/get-observation-file-url.query';
import { ListObservationsAttachmentsQuery } from './infrastructure/queries/list-observations-attachments.query';
import { ListObservationsQuery } from './infrastructure/queries/list-observations.query';
import { SearchMagistratsQuery } from './infrastructure/queries/search-magistrats.query';
import { ObservationRepository } from './infrastructure/repositories/observation.repository';
import { MagistratController } from './magistrat.controller';
import { ObservationAttachmentsController } from './observation-attachments.controller';
import { ObservationController } from './observation.controller';
import { ObservationService } from './observation.service';

@Module({
  imports: [TransparenceModule],
  controllers: [MagistratController, ObservationController, ObservationAttachmentsController],
  exports: [ObservationService, MagistratService],
  providers: [
    DetailMagistratQuery,
    GetObservationDetailsQuery,
    GetObservationFileUrlQuery,
    ListObservationsAttachmentsQuery,
    ListObservationsQuery,
    MagistratService,
    ObservationFinder,
    ObservationRepository,
    ObservationService,
    SearchMagistratsQuery,
  ],
})
export class ObservationModule {}
