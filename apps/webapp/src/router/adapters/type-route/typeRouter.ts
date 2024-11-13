import { RouterProvider } from "../../core-logic/providers/router";

import { createRouter, defineRoute, param } from "type-route";

const routeSegments = {
  dossierDeNomination: "dossiers-de-nomination",
};

const { RouteProvider, useRoute, routes, session } = createRouter({
  login: defineRoute("/login"),
  reportList: defineRoute(`/${routeSegments.dossierDeNomination}`),
  reportOverview: defineRoute(
    {
      id: param.path.string,
    },
    (p) => `/${routeSegments.dossierDeNomination}/${p.id}`,
  ),
});

// React adapter
export { RouteProvider, useRoute, session as sessionForTestingPurpose };

// Navigation adapter
export class TypeRouterProvider implements RouterProvider {
  goToLogin() {
    routes.login().push();
  }
  goToReportList() {
    routes.reportList().push();
  }
  gotToReportOverview(id: string) {
    routes.reportOverview({ id }).push();
  }

  getLoginHref(): string {
    return routes.login().href;
  }
  getReportListHref(): string {
    return routes.reportList().href;
  }

  getReportOverviewAnchorAttributes(id: string) {
    return routes.reportOverview({ id }).link;
  }
}
