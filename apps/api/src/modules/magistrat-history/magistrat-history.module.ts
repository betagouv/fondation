import { Module } from '@nestjs/common';

import { ObservationModule } from '../observation/observation.module';
import { TransparenceModule } from '../session/transparence/transparence.module';

import { ListMagistratNominationFilesQuery } from './infrastructure/queries/list-magistrat-nomination-files.query';
import { ListMagistratObservationsQuery } from './infrastructure/queries/list-magistrat-observations.query';
import { MagistratHistoryController } from './magistrat-history.controller';
import { MagistratHistoryService } from './magistrat-history.service';

// reads the sessions and the observations of a magistrat: lives apart so that Magistrat depends on no other module
@Module({
  controllers: [MagistratHistoryController],
  imports: [ObservationModule, TransparenceModule],
  providers: [ListMagistratNominationFilesQuery, ListMagistratObservationsQuery, MagistratHistoryService],
})
export class MagistratHistoryModule {}
