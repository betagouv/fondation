import { forwardRef, Module } from '@nestjs/common';

import { TransparenceModule } from 'src/modules/session/transparence/transparence.module';

import { DetailReportQuery } from './infrastructure/queries/detail-report.query';
import { GetReportFileUrlsQuery } from './infrastructure/queries/get-report-file-urls.query';
import { ListMemberSessionReportsQuery } from './infrastructure/queries/list-member-session-reports.query';
import { SearchNominationFileMembersReportQuery } from './infrastructure/queries/search-nomination-file-members-report.query';
import { ReportRepository } from './infrastructure/report.repository';
import { SessionReportsRepository } from './infrastructure/session-reports.repository';
import { MemberReportsController } from './member-reports.controller';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  controllers: [MemberReportsController, ReportController],
  exports: [ReportService],
  imports: [forwardRef(() => TransparenceModule)],
  providers: [
    ReportRepository,
    ReportService,
    SessionReportsRepository,
    GetReportFileUrlsQuery,
    DetailReportQuery,
    ListMemberSessionReportsQuery,
    SearchNominationFileMembersReportQuery,
  ],
})
export class ReportModule {}
