import { Module } from '@nestjs/common';

import { DetailReportQuery } from './infrastructure/queries/detail-report.query';
import { GetReportFileUrlsQuery } from './infrastructure/queries/get-report-file-urls.query';
import { ReportRepository } from './infrastructure/report.repository';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  controllers: [ReportController],
  exports: [ReportService],
  providers: [ReportRepository, ReportService, GetReportFileUrlsQuery, DetailReportQuery],
})
export class ReportModule {}
