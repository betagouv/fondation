import { Module } from '@nestjs/common';

import { DetailReportQuery } from './infrastructure/queries/detail-report.query';
import { GetReportFileUrlsQuery } from './infrastructure/queries/get-report-file-urls.query';
import { ListMemberSessionReportsQuery } from './infrastructure/queries/list-member-session-reports.query';
import { SearchNominationFileMembersReportQuery } from './infrastructure/queries/search-nomination-file-members-report.query';
import { ReportRepository } from './infrastructure/report.repository';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  controllers: [ReportController],
  exports: [ReportService],
  providers: [
    ReportRepository,
    ReportService,
    GetReportFileUrlsQuery,
    DetailReportQuery,
    ListMemberSessionReportsQuery,
    SearchNominationFileMembersReportQuery,
  ],
})
export class ReportModule {}
