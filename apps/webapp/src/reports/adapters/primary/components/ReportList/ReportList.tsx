import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { useEffect } from "react";
import { listReport } from "../../../../core-logic/use-cases/report-listing/listReport.use-case";
import { useAppDispatch, useAppSelector } from "../../hooks/react-redux";
import { selectReportList } from "../../selectors/selectReportList";
import { ReportListFilters } from "./ReportListFilters";
import { ReportsTable } from "./ReportsTable";

export const ReportList = () => {
  const { reports, filters } = useAppSelector(selectReportList);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(listReport());
  }, [dispatch]);

  return (
    <div className="flex flex-col">
      <div className={cx("fr-h1", "fr-text--bold")}>Mes rapports</div>
      <ReportListFilters filters={filters} />
      {reports.length ? (
        <ReportsTable reports={reports} />
      ) : (
        <div>Aucun rapport.</div>
      )}
    </div>
  );
};
export default ReportList;
