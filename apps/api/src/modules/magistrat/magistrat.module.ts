import { Module } from '@nestjs/common';

import { MagistratProfilesFinder } from './infrastructure/finders/magistrat-profiles.finder';
import { DetailMagistratQuery } from './infrastructure/queries/detail-magistrat.query';
import { ListMagistratPhoneNumbersQuery } from './infrastructure/queries/list-magistrat-phone-numbers.query';
import { SearchMagistratsQuery } from './infrastructure/queries/search-magistrats.query';
import { MagistratPhoneNumbersRepository } from './infrastructure/repositories/magistrat-phone-numbers.repository';
import { MagistratController } from './magistrat.controller';
import { MagistratService } from './magistrat.service';

@Module({
  controllers: [MagistratController],
  exports: [MagistratService],
  providers: [
    DetailMagistratQuery,
    ListMagistratPhoneNumbersQuery,
    MagistratPhoneNumbersRepository,
    MagistratProfilesFinder,
    MagistratService,
    SearchMagistratsQuery,
  ],
})
export class MagistratModule {}
