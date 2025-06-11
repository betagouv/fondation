import { FC } from "react";
import { DateOnlyJson, Magistrat } from "shared-models";
import {
  BreadcrumCurrentPage,
  selectBreadcrumb,
} from "../../../../../router/adapters/selectors/selectBreadcrumb";
import { Breadcrumb } from "../../../../../shared-kernel/adapters/primary/react/Breadcrumb";
import { useAppSelector } from "../../hooks/react-redux";
import { useReportsList } from "../../hooks/use-reports-list";
import { useSelectReportsList } from "../../hooks/use-select-reports-list";
import { useTransparencyAttachments } from "../../hooks/use-transparency-attachments";
import { NewReportsCount } from "./NewReportsCount";
import { ReportsTable } from "./ReportsTable";
import { TransparencyFilesList } from "./TransparencyFilesList";

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
