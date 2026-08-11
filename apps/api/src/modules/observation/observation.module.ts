import { forwardRef, Module } from '@nestjs/common';

import { TransparenceModule } from '../session/transparence/transparence.module';

import { ObservationFinder } from './infrastructure/finders/observation.finder';
import { GetObservationDetailsQuery } from './infrastructure/queries/get-observation-details.query';
import { GetObservationFileUrlQuery } from './infrastructure/queries/get-observation-file-url.query';
import { ListObservationsAttachmentsQuery } from './infrastructure/queries/list-observations-attachments.query';
import { ListObservationsQuery } from './infrastructure/queries/list-observations.query';
import { ObservationRepository } from './infrastructure/repositories/observation.repository';
import { ObservationAttachmentsController } from './observation-attachments.controller';
import { ObservationController } from './observation.controller';
import { ObservationService } from './observation.service';

@Module({
  imports: [forwardRef(() => TransparenceModule)],
  controllers: [ObservationController, ObservationAttachmentsController],
  exports: [ObservationService],
  providers: [
    GetObservationDetailsQuery,
    GetObservationFileUrlQuery,
    ListObservationsAttachmentsQuery,
    ListObservationsQuery,
    ObservationFinder,
    ObservationRepository,
    ObservationService,
  ],
})
export class ObservationModule {}
