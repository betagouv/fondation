import { RouterProvider } from "../../core-logic/providers/router";

import { createRouter, defineRoute, param } from "type-route";

const routeSegments = {
  dossierDeNomination: "dossiers-de-nomination",
};

const { RouteProvider, useRoute, routes } = createRouter({
  login: defineRoute(["/login", "/"]),
  nominationCaseList: defineRoute(`/${routeSegments.dossierDeNomination}`),
  nominationFileOverview: defineRoute(
    {
      id: param.path.string,
    },
    (p) => `/${routeSegments.dossierDeNomination}/${p.id}`,
  ),
});

// React adapter
export { RouteProvider, useRoute };

// Navigation adapter
export class TypeRouterProvider implements RouterProvider {
  goToLogin() {
    routes.login().push();
  }
  goToNominationFileList() {
    routes.nominationCaseList().push();
  }
  gotToNominationFileOverview(id: string) {
    routes.nominationFileOverview({ id }).push();
  }

  getLoginHref(): string {
    return routes.login().href;
  }

  getNominationFileOverviewAnchorAttributes(id: string) {
    return routes.nominationFileOverview({ id }).link;
  }
}
