import { FC } from "react";
import { PageContentLayout } from "../../../../../shared-kernel/adapters/primary/react/PageContentLayout";
import ReportList, { ReportListProps } from "./ReportList";

export const ReportListPage: FC<ReportListProps> = (props) => (
  <PageContentLayout>
    <ReportList {...props} />
  </PageContentLayout>
);
export default ReportListPage;
