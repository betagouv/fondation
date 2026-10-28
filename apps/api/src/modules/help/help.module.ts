import { Module } from '@nestjs/common';

import { HelpService } from './help.service';
import { HelpPageRepository } from './infrastructure/help-page.repository';
import { HelpController } from './infrastructure/help.controller';
import { DetailHelpPageQuery } from './infrastructure/queries/detail-help-page.query';
import { ReaderHelpPageController } from './infrastructure/reader-help-page.controller';

@Module({
  controllers: [HelpController, ReaderHelpPageController],
  providers: [DetailHelpPageQuery, HelpPageRepository, HelpService],
})
export class HelpModule {}
