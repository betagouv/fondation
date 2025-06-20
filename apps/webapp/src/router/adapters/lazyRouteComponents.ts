import { lazy } from "react";

const Login = import("../../authentication/adapters/primary/components/Login");
export const LazyLogin = lazy(() => Login);

const TransparenciesPage = import(
  "../../reports/adapters/primary/components/Transparencies/TransparenciesPage"
);
export const LazyTransparencies = lazy(() => TransparenciesPage);

const ReportListPage = import(
  "../../reports/adapters/primary/components/ReportList/ReportListPage"
);
export const LazyReportListPage = lazy(() => ReportListPage);

const ReportOverviewPage = import(
  "../../reports/adapters/primary/components/ReportOverview/ReportOverviewPage"
);
export const LazyReportOverview = lazy(() => ReportOverviewPage);

const SecretariatGeneralDashboardPage = import(
  "../../secretariat-general/adapters/primary/components/Dashboard"
);

export const LazySecretariatGeneralDashboard = lazy(
  () => SecretariatGeneralDashboardPage,
);

const NouvelleTransparencePage = import(
  "../../secretariat-general/adapters/primary/components/NouvelleTransparence/NouvelleTransparence"
);
export const LazyNouvelleTransparence = lazy(() => NouvelleTransparencePage);

const LazyTransparencePage = import(
  "../../secretariat-general/adapters/primary/components/Transparence/Transparence"
);
export const LazyTransparence = lazy(() => LazyTransparencePage);
