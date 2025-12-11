import { Module } from '@nestjs/common';

import { FilesModule } from 'src/modules/framework/files';

import { ReportRepository } from './infrastructure/report.repository';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { GetReportFileUrlsQuery } from './infrastructure/queries/get-report-file-urls.query';
import { DetailReportQuery } from './infrastructure/queries/detail-report.query';

@Module({
  controllers: [ReportController],
  imports: [FilesModule.forFeature('reports')],
  exports: [ReportService],
  providers: [
    ReportRepository,
    ReportService,
    GetReportFileUrlsQuery,
    DetailReportQuery,
  ],
})
export class ReportModule {}
