import { Module } from '@nestjs/common';

import { ReportRepository } from './infrastructure/report.repository';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { GetReportFileUrlsQuery } from './infrastructure/queries/get-report-file-urls.query';
import { DetailReportQuery } from './infrastructure/queries/detail-report.query';

@Module({
  controllers: [ReportController],
  exports: [ReportService],
  providers: [
    ReportRepository,
    ReportService,
    GetReportFileUrlsQuery,
    DetailReportQuery,
  ],
})
export class ReportModule {}
