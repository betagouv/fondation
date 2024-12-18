import { lazy } from "react";

export const LazyLogin = lazy(
  () => import("../../authentication/adapters/primary/components/Login"),
);
export const ReportListPage = lazy(
  () =>
    import(
      "../../reports/adapters/primary/components/ReportList/ReportListPage"
    ),
);
export const LazyReportOverview = lazy(
  () =>
    import(
      "../../reports/adapters/primary/components/ReportOverview/ReportOverview"
    ),
);
