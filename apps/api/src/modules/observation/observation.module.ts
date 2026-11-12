import { forwardRef, Module } from '@nestjs/common';

import { MagistratModule } from '../magistrat/magistrat.module';
import { TransparenceModule } from '../session/transparence/transparence.module';

import { NominationFileObservationsFinder } from './infrastructure/finders/nomination-file-observations.finder';
import { ObservantAuditionsFinder } from './infrastructure/finders/observant-auditions.finder';
import { ObservationFinder } from './infrastructure/finders/observation.finder';
import { CountSessionObservationsQuery } from './infrastructure/queries/count-session-observations.query';
import { GetObservationDetailsQuery } from './infrastructure/queries/get-observation-details.query';
import { GetObservationFileUrlQuery } from './infrastructure/queries/get-observation-file-url.query';
import { ListObservationsAttachmentsQuery } from './infrastructure/queries/list-observations-attachments.query';
import { ListObservationsQuery } from './infrastructure/queries/list-observations.query';
import { ListSessionObservationsQuery } from './infrastructure/queries/list-session-observations.query';
import { ObservantAuditionRepository } from './infrastructure/repositories/observant-audition.repository';
import { ObservationRepository } from './infrastructure/repositories/observation.repository';
import { ObservationController } from './observation.controller';
import { ObservationService } from './observation.service';
import { SessionObservationsController } from './session-observations.controller';

@Module({
  imports: [MagistratModule, forwardRef(() => TransparenceModule)],
  controllers: [ObservationController, SessionObservationsController],
  exports: [ObservationService],
  providers: [
    CountSessionObservationsQuery,
    GetObservationDetailsQuery,
    GetObservationFileUrlQuery,
    ListObservationsAttachmentsQuery,
    ListObservationsQuery,
    ListSessionObservationsQuery,
    NominationFileObservationsFinder,
    ObservantAuditionRepository,
    ObservantAuditionsFinder,
    ObservationFinder,
    ObservationRepository,
    ObservationService,
  ],
})
export class ObservationModule {}
