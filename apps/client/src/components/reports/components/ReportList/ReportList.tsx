import type { FC } from "react";
import type { DateOnlyJson, Magistrat } from "shared-models";

import { NewReportsCount } from "./NewReportsCount";
import { ReportsTable } from "./ReportsTable";
import { TransparencyFilesList } from "./TransparencyFilesList";
import { Breadcrumb } from "../../../shared/Breadcrumb";

export interface ReportListProps {
  transparency: string;
  formation: Magistrat.Formation;
  dateTransparence: DateOnlyJson;
}

export const ReportList: FC<ReportListProps> = ({
  transparency,
  formation,
  dateTransparence,
}) => {
  const currentPage = {
    name: BreadcrumCurrentPage.perGdsTransparencyReports,
    formation,
  } as const;
  const breadcrumb = useAppSelector((state) =>
    selectBreadcrumb(state, currentPage),
  );
  const { title, headers, reports, newReportsCount } = useSelectReportsList(
    transparency,
    formation,
    dateTransparence,
  );
  const attachments = useTransparencyAttachments(transparency, formation);

  useReportsList();

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
              color,
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
      )}
    </div>
  );
};
export default ReportList;
