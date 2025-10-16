import type { FC } from 'react';
import { useListReports } from '../../../../react-query/queries/list-reports.queries';
import { formatReportList } from '../../../../utils/format-report-list.utils';

import { useGetTransparencyAttachmentsQuery } from '../../../../react-query/queries/get-transparency-attachments.query';

import { Magistrat, type DateOnlyJson } from 'shared-models';
import { ReportsTable } from './ReportsTable';
import { TransparencyFilesList } from './TransparencyFilesList';

export interface ReportListProps {
  transparency: string;
  formation: Magistrat.Formation;
  dateTransparence: DateOnlyJson;
}

export const ReportList: FC<ReportListProps> = ({ transparency, formation, dateTransparence }) => {
  const { data: reportsData, isPending: isReportsLoading } = useListReports();
  const { newReportsCount, reports, headers } = formatReportList(reportsData?.data || [], {
    transparency,
    formation,
    dateTransparence
  });

  const {
    data: attachments,
    isLoading: isAttachmentsLoading,
    isError: isAttachmentsError
  } = useGetTransparencyAttachmentsQuery(reports[0]?.sessionImportId);

  if (isReportsLoading) {
    return null;
  }

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
};
export default ReportList;
