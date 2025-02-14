import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { FC } from "react";
import ReportList, { ReportListProps } from "./ReportList";

export const ReportListPage: FC<ReportListProps> = (props) => (
  <div className={cx("fr-px-15w", "fr-py-5w")}>
    <ReportList {...props} />
  </div>
);
export default ReportListPage;
