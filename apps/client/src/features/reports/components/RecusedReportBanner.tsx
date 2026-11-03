import { RecusedReporterBanner } from '@/shared/components/recused-reporter-banner';
import type { DetailedReportDto } from '@api/types';
import { useUser } from '@queries/auth.queries';
import { useMyReportQuery } from '@queries/reports.queries';

export function RecusedReportBanner(props: {
  report: Pick<DetailedReportDto, 'id' | 'nominationFileId' | 'sessionId'>;
}) {
  const { report } = props;
  const { user } = useUser();
  const { data: myReport } = useMyReportQuery({
    enabled: true,
    nominationFileId: report.nominationFileId,
    sessionId: report.sessionId,
    userId: user?.id,
  });

  // a co-reporter also opens the other reporter's report, where their own recusal does not apply
  if (myReport?.id !== report.id || myReport.state !== 'NOT_APPLICABLE') return null;

  return <RecusedReporterBanner fullWidth />;
}
