import { forwardRef, Module } from '@nestjs/common';

import { ObservationModule } from '../observation/observation.module';
import { TransparenceModule } from '../session/transparence/transparence.module';

import { MagistratProfilesFinder } from './infrastructure/finders/magistrat-profiles.finder';
import { DetailMagistratQuery } from './infrastructure/queries/detail-magistrat.query';
import { ListMagistratNominationFilesQuery } from './infrastructure/queries/list-magistrat-nomination-files.query';
import { ListMagistratObservationsQuery } from './infrastructure/queries/list-magistrat-observations.query';
import { ListMagistratPhoneNumbersQuery } from './infrastructure/queries/list-magistrat-phone-numbers.query';
import { SearchMagistratsQuery } from './infrastructure/queries/search-magistrats.query';
import { MagistratPhoneNumbersRepository } from './infrastructure/repositories/magistrat-phone-numbers.repository';
import { MagistratController } from './magistrat.controller';
import { MagistratService } from './magistrat.service';

@Module({
  imports: [forwardRef(() => ObservationModule), forwardRef(() => TransparenceModule)],
  controllers: [MagistratController],
  exports: [MagistratService],
  providers: [
    DetailMagistratQuery,
    ListMagistratNominationFilesQuery,
    ListMagistratObservationsQuery,
    ListMagistratPhoneNumbersQuery,
    MagistratPhoneNumbersRepository,
    MagistratProfilesFinder,
    MagistratService,
    SearchMagistratsQuery,
  ],
})
export class MagistratModule {}
