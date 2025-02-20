import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { FC } from "react";
import { Transparency } from "shared-models";
import { useAppSelector } from "../../hooks/react-redux";
import { useReportsList } from "../../hooks/use-reports-list";
import { selectReportList } from "../../selectors/selectReportList";
import { ReportsTable } from "./ReportsTable";

export interface ReportListProps {
  transparency?: Transparency;
}

export const ReportList: FC<ReportListProps> = ({ transparency }) => {
  const { headers, reports } = useAppSelector((state) =>
    selectReportList(state, transparency),
  );
  useReportsList();

  return (
    <div className="flex flex-col">
      <div className={cx("fr-h1", "fr-text--bold")}>Mes rapports</div>
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
