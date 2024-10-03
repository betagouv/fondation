import { RouterProvider } from "../../core-logic/providers/router";

import { createRouter, defineRoute, param } from "type-route";

const routeSegments = {
  dossierDeNomination: "dossiers-de-nomination",
};

const { RouteProvider, useRoute, routes } = createRouter({
  login: defineRoute(["/login", "/"]),
  nominationCaseList: defineRoute(`/${routeSegments.dossierDeNomination}`),
  nominationCaseOverview: defineRoute(
    {
      id: param.path.string,
    },
    (p) => `/${routeSegments.dossierDeNomination}/${p.id}`
  ),
});

// React adapter
export { RouteProvider, useRoute };

// Navigation adapter
export class TypeRouterProvider implements RouterProvider {
  goToLogin() {
    routes.login().push();
  }
  goToNominationCaseList() {
    routes.nominationCaseList().push();
  }
  gotToNominationCaseOverview(id: string) {
    routes.nominationCaseOverview({ id }).push();
  }

  getLoginHref(): string {
    return routes.login().href;
  }

  getNominationCaseOverviewAnchorAttributes(id: string) {
    return routes.nominationCaseOverview({ id }).link;
  }
}
