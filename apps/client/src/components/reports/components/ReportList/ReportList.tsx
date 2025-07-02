import type { FC } from 'react';
import type { DateOnlyJson, Magistrat } from 'shared-models';
import {
  getTransparencesBreadCrumb,
  TransparencesCurrentPage
} from '../../../../utils/transparences-breadcrumb.utils';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../../shared/Breadcrumb';

// import { NewReportsCount } from './NewReportsCount';
// import { ReportsTable } from './ReportsTable';
// import { TransparencyFilesList } from './TransparencyFilesList';
// import { Breadcrumb } from '../../../shared/Breadcrumb';

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
  // const currentPage = {
  //   name: BreadcrumCurrentPage.perGdsTransparencyReports,
  //   formation
  // } as const;
  // const breadcrumb = useAppSelector((state) =>
  //   selectBreadcrumb(state, currentPage)
  // );
  // const { title, headers, reports, newReportsCount } = useSelectReportsList(
  //   transparency,
  //   formation,
  //   dateTransparence
  // );
  // const attachments = useTransparencyAttachments(transparency, formation);

  // useReportsList();

  console.log({
    transparency,
    formation,
    dateTransparence
  });

  return (
    <div className="flex flex-col">
      <Breadcrumb
        id="reports-breadcrumb"
        ariaLabel="Fil d'Ariane des rapports"
        breadcrumb={breadcrumb}
      />

      {/* <h1>
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

      {attachments && attachments.length > 0 && (
        <div>
          <h2>Pièces jointes</h2>
          <TransparencyFilesList files={attachments} />
        </div>
      )} */}
    </div>
  );
};
export default ReportList;
