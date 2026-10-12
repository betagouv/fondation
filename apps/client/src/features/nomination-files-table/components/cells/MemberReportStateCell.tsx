import { useMemberReports } from '../../context/member-reports.context';
import { ReportStateTag } from '@/shared/components/report-state-tag';

export function MemberReportStateCell(props: { nominationFileId: string }) {
  const memberReports = useMemberReports();
  const report = memberReports.reportFor(props.nominationFileId);

  if (!report) return <>-</>;

  return <ReportStateTag state={report.state} />;
}
