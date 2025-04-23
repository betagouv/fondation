import { FC } from "react";
import { Magistrat, Transparency } from "shared-models";
import {
  BreadcrumCurrentPage,
  selectBreadcrumb,
} from "../../../../../router/adapters/selectors/selectBreadcrumb";
import { Breadcrumb } from "../../../../../shared-kernel/adapters/primary/react/Breadcrumb";
import { useAppSelector } from "../../hooks/react-redux";
import { useReportsList } from "../../hooks/use-reports-list";
import { useTransparencyAttachments } from "../../hooks/use-transparency-attachments";
import { NewReportsCount } from "./NewReportsCount";
import { ReportsTable } from "./ReportsTable";
import { TransparencyFilesList } from "./TransparencyFilesList";
import { useSelectReportsList } from "../../hooks/use-select-reports-list";

export interface ReportListProps {
  transparency: Transparency;
  formation: Magistrat.Formation;
}

export const ReportList: FC<ReportListProps> = ({
  transparency,
  formation,
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

      {attachments.length > 0 && (
        <div>
          <h2>Pièces jointes</h2>
          <TransparencyFilesList files={attachments} />
        </div>
      )}
    </div>
  );
};
export default ReportList;
