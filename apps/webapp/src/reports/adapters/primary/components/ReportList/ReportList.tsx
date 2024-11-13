import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/react-redux";
import { selectReportList } from "../../selectors/selectReportList";
import { listReport } from "../../../../core-logic/use-cases/report-listing/listReport.use-case";
import { ReportsTable } from "./ReportsTable";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";

export const ReportList = () => {
  const { reports } = useAppSelector(selectReportList);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(listReport());
  }, [dispatch]);

  return reports.length ? (
    <div className="flex flex-col">
      <div className={cx("fr-h1", "fr-text--bold")}>Mes rapports</div>
      <ReportsTable reports={reports} />
    </div>
  ) : (
    <div>Aucune nomination.</div>
  );
};
export default ReportList;
