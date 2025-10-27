import { formatReportList } from '../../../../utils/format-report-list.utils';

import { useGetTransparencyAttachmentsQuery } from '../../../../react-query/queries/get-transparency-attachments.query';

import type { DetailedSessionReport } from '../../../../react-query/queries/members/sessions.queries';
import { ReportsTable } from './ReportsTable';
import { TransparencyFilesList } from './TransparencyFilesList';

export function ReportList(props: { sessionImportId: string; reports: DetailedSessionReport[] }) {
  const { reports, headers } = formatReportList(props.reports);

  const {
    data: attachments,
    isLoading: isAttachmentsLoading,
    isError: isAttachmentsError
  } = useGetTransparencyAttachmentsQuery(props.sessionImportId);

  return (
    <div className="my-4 flex flex-col gap-4">
      {/* {newReportsCount > 0 && <NewReportsCount newReportsCount={newReportsCount} />} */}
      {reports.length ? <ReportsTable headers={headers} reports={reports} /> : <div>Aucun rapport.</div>}
      {!isAttachmentsLoading && !isAttachmentsError && attachments && attachments.length > 0 && (
        <div>
          <h2>Pièces jointes</h2>
          <TransparencyFilesList files={attachments} />
        </div>
      )}
    </div>
  );
}
export default ReportList;
