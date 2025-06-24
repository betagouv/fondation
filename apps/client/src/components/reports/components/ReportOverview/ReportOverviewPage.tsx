import type { FC } from "react";

import ReportOverview, { type ReportOverviewProps } from "./ReportOverview";
import { PageContentLayout } from "../../../shared/PageContentLayout";

export const ReportOverviewPage: FC<ReportOverviewProps> = (props) => (
  <PageContentLayout fullBackgroundOrange>
    <ReportOverview {...props} />
  </PageContentLayout>
);
export default ReportOverviewPage;
