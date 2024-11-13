import { RouterProvider } from "../core-logic/providers/router";

export class StubRouterProvider implements RouterProvider {
  onClickAttribute = () => null;

  goToLogin = () => {};
  goToReportList = () => {};
  gotToReportOverview = () => {};

  getLoginHref = () => "";
  getReportListHref = () => "stub-report-list-href";

  getReportOverviewAnchorAttributes = (id: string) => {
    return {
      href: "/dossier-de-nomination/" + id,
      onClick: this.onClickAttribute,
    };
  };
}
