import { Module } from '@nestjs/common';

import { ApiClientsModule } from '../api-clients';

import { MagistratProfilesFinder } from './infrastructure/finders/magistrat-profiles.finder';
import { DetailMagistratQuery } from './infrastructure/queries/detail-magistrat.query';
import { FindMagistratStatusQuery } from './infrastructure/queries/find-magistrat-status.query';
import { IdentifyMagistratQuery } from './infrastructure/queries/identify-magistrat.query';
import { ListMagistratAttachedEmailsQuery } from './infrastructure/queries/list-magistrat-attached-emails.query';
import { ListMagistratPhoneNumbersQuery } from './infrastructure/queries/list-magistrat-phone-numbers.query';
import { ListUnrecognisedMagistratEmailsQuery } from './infrastructure/queries/list-unrecognised-magistrat-emails.query';
import { SearchMagistratsQuery } from './infrastructure/queries/search-magistrats.query';
import { AttachedMagistratEmailRepository } from './infrastructure/repositories/attached-magistrat-email.repository';
import { MagistratPhoneNumbersRepository } from './infrastructure/repositories/magistrat-phone-numbers.repository';
import { UnrecognisedMagistratEmailRepository } from './infrastructure/repositories/unrecognised-magistrat-email.repository';
import { MagistratController } from './magistrat.controller';
import { MagistratPublicController } from './magistrat.public.controller';
import { MagistratService } from './magistrat.service';

@Module({
  controllers: [MagistratController, MagistratPublicController],
  exports: [MagistratService],
  imports: [ApiClientsModule],
  providers: [
    AttachedMagistratEmailRepository,
    DetailMagistratQuery,
    FindMagistratStatusQuery,
    IdentifyMagistratQuery,
    ListMagistratAttachedEmailsQuery,
    ListMagistratPhoneNumbersQuery,
    ListUnrecognisedMagistratEmailsQuery,
    MagistratPhoneNumbersRepository,
    MagistratProfilesFinder,
    MagistratService,
    SearchMagistratsQuery,
    UnrecognisedMagistratEmailRepository,
  ],
})
export class MagistratModule {}
