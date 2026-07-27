import { Module } from '@nestjs/common';

import { TransparenceModule } from '../session/transparence/transparence.module';

import { DetailMagistratQuery } from './infrastructure/queries/detail-magistrat.query';
import { ListMagistratNominationFilesQuery } from './infrastructure/queries/list-magistrat-nomination-files.query';
import { ListMagistratObservationsQuery } from './infrastructure/queries/list-magistrat-observations.query';
import { SearchMagistratsQuery } from './infrastructure/queries/search-magistrats.query';
import { MagistratController } from './magistrat.controller';
import { MagistratService } from './magistrat.service';

@Module({
  imports: [TransparenceModule],
  controllers: [MagistratController],
  exports: [MagistratService],
  providers: [
    DetailMagistratQuery,
    ListMagistratNominationFilesQuery,
    ListMagistratObservationsQuery,
    MagistratService,
    SearchMagistratsQuery,
  ],
})
export class MagistratModule {}
