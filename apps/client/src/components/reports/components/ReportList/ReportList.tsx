import { formatReportList } from '../../../../utils/format-report-list.utils';

import type { DetailedSessionReport } from '../../../../react-query/queries/members/sessions.queries';
import { ReportsTable } from './ReportsTable';
import { TransparencyAttachmentsSection } from './TransparencyAttachmentsSection';

export function ReportList(
  props: React.PropsWithChildren<{ sessionImportId: string; reports: DetailedSessionReport[] }>
) {
  const { reports, headers } = formatReportList(props.reports);

  return (
    <div className="my-4 flex flex-col gap-4">
      {reports.length ? (
        <ReportsTable headers={headers} reports={reports}>
          {props.children}
        </ReportsTable>
      ) : (
        <div>Aucun rapport.</div>
      )}
      <TransparencyAttachmentsSection sessionImportId={props.sessionImportId} />
    </div>
  );
}
export default ReportList;
