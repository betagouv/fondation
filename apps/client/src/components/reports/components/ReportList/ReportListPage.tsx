import type { FC } from "react";
import { PageContentLayout } from "../../../shared/PageContentLayout";
import { ReportList, type ReportListProps } from "./ReportList";

export const ReportListPage: FC<ReportListProps> = (props) => (
  <PageContentLayout>
    <ReportList {...props} />
  </PageContentLayout>
);
export default ReportListPage;
