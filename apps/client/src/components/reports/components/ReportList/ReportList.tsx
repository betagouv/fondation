import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DateOnlyJson, Magistrat } from 'shared-models';
import { useListReports } from '../../../../queries/list-reports.queries';
import { formatReportList } from '../../../../utils/format-report-list.utils';
import {
  getTransparencesBreadCrumb,
  TransparencesCurrentPage
} from '../../../../utils/transparences-breadcrumb.utils';
import { useGetTransparenciesAttachments } from '../../../../queries/get-transparencies-attachments.query';
import { Breadcrumb } from '../../../shared/Breadcrumb';
import { NewReportsCount } from './NewReportsCount';
import { ReportsTable } from './ReportsTable';
import { TransparencyFilesList } from './TransparencyFilesList';

export interface ReportListProps {
  transparency: string;
  formation: Magistrat.Formation;
  dateTransparence: DateOnlyJson;
}

export const ReportList: FC<ReportListProps> = ({
  transparency,
  formation,
  dateTransparence
}) => {
  const navigate = useNavigate();
  const breadcrumb = getTransparencesBreadCrumb(
    {
      name: TransparencesCurrentPage.perGdsTransparencyReports,
      formation
    },
    navigate
  );

  const { data: reportsData, isPending: isReportsLoading } = useListReports();
  const { newReportsCount, reports, headers, title } = formatReportList(
    reportsData?.data || [],
    {
      transparency,
      formation,
      dateTransparence
    }
  );

  const {
    data: attachments,
    isLoading: isAttachmentsLoading,
    isError: isAttachmentsError
  } = useGetTransparenciesAttachments(transparency, formation);

  if (isReportsLoading) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <Breadcrumb
        id="reports-breadcrumb"
        ariaLabel="Fil d'Ariane des rapports"
        breadcrumb={breadcrumb}
      />

      <h1>
        {title.map(({ text, color }, index) => (
          <span
            key={index}
            style={{
              color
            }}
          >
            {text}
          </span>
        ))}
      </h1>

      {newReportsCount > 0 && (
        <NewReportsCount newReportsCount={newReportsCount} />
      )}

      {reports.length ? (
        <ReportsTable headers={headers} reports={reports} />
      ) : (
        <div>Aucun rapport.</div>
      )}

      {!isAttachmentsLoading &&
        !isAttachmentsError &&
        attachments &&
        attachments.length > 0 && (
          <div>
            <h2>Pièces jointes</h2>
            <TransparencyFilesList files={attachments} />
          </div>
        )}
    </div>
  );
};
export default ReportList;
