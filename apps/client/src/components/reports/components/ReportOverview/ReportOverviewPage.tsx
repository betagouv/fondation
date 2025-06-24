import { FC } from "react";
import { PageContentLayout } from "../../../../../shared-kernel/adapters/primary/react/PageContentLayout";
import ReportOverview, { ReportOverviewProps } from "./ReportOverview";

export const ReportOverviewPage: FC<ReportOverviewProps> = (props) => (
  <PageContentLayout fullBackgroundOrange>
    <ReportOverview {...props} />
  </PageContentLayout>
);
export default ReportOverviewPage;
