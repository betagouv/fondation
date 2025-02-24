import { FC } from "react";
import { Magistrat, Transparency } from "shared-models";
import { useAppSelector } from "../../hooks/react-redux";
import { useReportsList } from "../../hooks/use-reports-list";
import { selectReportList } from "../../selectors/selectReportList";
import { ReportsTable } from "./ReportsTable";
import {
  BreadcrumCurrentPage,
  selectBreadcrumb,
} from "../../../../../router/adapters/selectors/selectBreadcrumb";
import { Breadcrumb } from "../../../../../shared-kernel/adapters/primary/react/Breadcrumb";
import { NewReportsCount } from "./NewReportsCount";

export interface ReportListProps {
  transparency?: Transparency;
  formation?: Magistrat.Formation;
}

const currentPage = {
  name: BreadcrumCurrentPage.perGdsTransparencyReports,
} as const;

export const ReportList: FC<ReportListProps> = ({
  transparency,
  formation,
}) => {
  const { title, headers, reports, newReportsCount } = useAppSelector((state) =>
    selectReportList(state, {
      transparencyFilter: transparency,
      formationFilter: formation,
    }),
  );
  const breadcrumb = useAppSelector((state) =>
    selectBreadcrumb(state, currentPage),
  );
  useReportsList();

  return (
    <div className="flex flex-col">
      <Breadcrumb
        id="reports-breadcrumb"
        ariaLabel="Fil d'Ariane des rapports"
        breadcrumb={breadcrumb}
      />

      <h1>
        {title.map(({ text, color }) => (
          <span
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
        <ReportsTable
          transparency={transparency}
          headers={headers}
          reports={reports}
        />
      ) : (
        <div>Aucun rapport.</div>
      )}
    </div>
  );
};
export default ReportList;
