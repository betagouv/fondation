import { RouterProvider } from "../core-logic/providers/router";

export class StubRouterProvider implements RouterProvider {
  onClickAttribute = () => null;

  goToLogin = () => {};
  goToTransparencies = () => {};

  getLoginHref = () => "";
  getTransparenciesHref = () => "stub-transparencies-href";
  getReportListHref = () => "stub-report-list-href";

  getReportOverviewAnchorAttributes = (id: string) => {
    return {
      href: "/dossier-de-nomination/" + id,
      onClick: this.onClickAttribute,
    };
  };
}
