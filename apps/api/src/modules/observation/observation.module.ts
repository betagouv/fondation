import { forwardRef, Module } from '@nestjs/common';

import { MagistratModule } from '../magistrat/magistrat.module';
import { TransparenceModule } from '../session/transparence/transparence.module';

import { FollowedUpObservationsController } from './followed-up-observations.controller';
import { NominationFileObservationsFinder } from './infrastructure/finders/nomination-file-observations.finder';
import { ObservantAuditionsFinder } from './infrastructure/finders/observant-auditions.finder';
import { ObservationFinder } from './infrastructure/finders/observation.finder';
import { CountSessionObservationsQuery } from './infrastructure/queries/count-session-observations.query';
import { GetObservationDetailsQuery } from './infrastructure/queries/get-observation-details.query';
import { GetObservationFileUrlQuery } from './infrastructure/queries/get-observation-file-url.query';
import { ListFollowedUpObservationsQuery } from './infrastructure/queries/list-followed-up-observations.query';
import { ListObservationsAttachmentsQuery } from './infrastructure/queries/list-observations-attachments.query';
import { ListObservationsQuery } from './infrastructure/queries/list-observations.query';
import { ListSessionObservationsQuery } from './infrastructure/queries/list-session-observations.query';
import { ObservantAuditionRepository } from './infrastructure/repositories/observant-audition.repository';
import { ObservationBlockRepository } from './infrastructure/repositories/observation-block.repository';
import { ObservationRepository } from './infrastructure/repositories/observation.repository';
import { ObservationBlocksController } from './observation-blocks.controller';
import { ObservationController } from './observation.controller';
import { ObservationService } from './observation.service';
import { SessionObservationsController } from './session-observations.controller';

@Module({
  imports: [MagistratModule, forwardRef(() => TransparenceModule)],
  controllers: [
    FollowedUpObservationsController,
    ObservationBlocksController,
    ObservationController,
    SessionObservationsController,
  ],
  exports: [ObservationService],
  providers: [
    CountSessionObservationsQuery,
    GetObservationDetailsQuery,
    GetObservationFileUrlQuery,
    ListFollowedUpObservationsQuery,
    ListObservationsAttachmentsQuery,
    ListObservationsQuery,
    ListSessionObservationsQuery,
    NominationFileObservationsFinder,
    ObservantAuditionRepository,
    ObservantAuditionsFinder,
    ObservationBlockRepository,
    ObservationFinder,
    ObservationRepository,
    ObservationService,
  ],
})
export class ObservationModule {}
