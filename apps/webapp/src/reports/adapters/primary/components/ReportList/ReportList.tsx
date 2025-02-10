import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { FC, useEffect } from "react";
import { listReport } from "../../../../core-logic/use-cases/report-listing/listReport.use-case";
import { useAppDispatch, useAppSelector } from "../../hooks/react-redux";
import { selectReportList } from "../../selectors/selectReportList";
import { ReportListFilters } from "./ReportListFilters";
import { ReportsTable } from "./ReportsTable";
import { Transparency } from "shared-models";

export interface ReportListProps {
  transparency?: Transparency;
}

export const ReportList: FC<ReportListProps> = ({ transparency }) => {
  const { headers, reports, filters } = useAppSelector((state) =>
    selectReportList(state, transparency),
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(listReport());
  }, [dispatch]);

  return (
    <div className="flex flex-col">
      <div className={cx("fr-h1", "fr-text--bold")}>Mes rapports</div>
      <ReportListFilters filters={filters} />
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
