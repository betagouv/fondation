import { Module } from '@nestjs/common';

import { ListRemarksQuery } from './infrastructure/queries/list-remarks.query';
import { RemarkRepository } from './infrastructure/remark.repository';
import { RemarksController } from './infrastructure/remarks.controller';
import { RemarksService } from './remarks.service';

@Module({
  controllers: [RemarksController],
  providers: [ListRemarksQuery, RemarkRepository, RemarksService],
})
export class RemarksModule {}
