import { lazy } from "react";

export const LazyLogin = lazy(
  () => import("../../authentication/adapters/primary/components/Login"),
);
export const LazyTransparencies = lazy(
  () =>
    import(
      "../../reports/adapters/primary/components/Transparencies/TransparenciesPage"
    ),
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
      "../../reports/adapters/primary/components/ReportOverview/ReportOverviewPage"
    ),
);
