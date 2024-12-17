import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import ReportList from "./ReportList";

export const ReportListPage = () => {
  return (
    <div className={cx("fr-px-15w", "fr-py-15w")}>
      <ReportList />
    </div>
  );
};
export default ReportListPage;
