import { Module } from '@nestjs/common';

import { FilesModule } from 'src/modules/framework/files';

import { ReportRepository } from './infrastructure/report.repository';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  controllers: [ReportController],
  imports: [FilesModule.forFeature('reports')],
  exports: [ReportService],
  providers: [ReportRepository, ReportService],
})
export class ReportModule {}
