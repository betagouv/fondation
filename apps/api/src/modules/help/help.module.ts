import { Module } from '@nestjs/common';

import { HelpService } from './help.service';
import { HelpPageRepository } from './infrastructure/help-page.repository';
import { HelpController } from './infrastructure/help.controller';
import { DetailHelpPageQuery } from './infrastructure/queries/detail-help-page.query';

@Module({
  controllers: [HelpController],
  providers: [DetailHelpPageQuery, HelpPageRepository, HelpService],
})
export class HelpModule {}
