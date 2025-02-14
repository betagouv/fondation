import { Transparency } from "shared-models";
import { RouterProvider } from "../../core-logic/providers/router";

import { createRouter, defineRoute, param } from "type-route";
import { GdsTransparenciesRoutesMapper } from "../../core-logic/models/gds-transparencies-routes-mapper";

const routeSegments = {
  transparences: "transparences",
  dossierDeNomination: "dossiers-de-nomination",
};

const { RouteProvider, useRoute, routes, session } = createRouter({
  login: defineRoute("/login"),
  transparencies: defineRoute([
    `/${routeSegments.transparences}`,
    `/${routeSegments.dossierDeNomination}`,
  ]),
  reportList: defineRoute(
    {
      transparency: param.path.string,
    },
    (p) =>
      `/${routeSegments.transparences}/${p.transparency}/${routeSegments.dossierDeNomination}`,
  ),
  reportOverview: defineRoute(
    {
      transparency: param.path.string,
      id: param.path.string,
    },
    (p) =>
      `/${routeSegments.transparences}/${p.transparency}/${routeSegments.dossierDeNomination}/${p.id}`,
  ),
});

// React adapter
export { RouteProvider, useRoute, session as sessionForTestingPurpose };

// Navigation adapter
export class TypeRouterProvider implements RouterProvider {
  goToLogin() {
    routes.login().push();
  }
  goToTransparencies() {
    routes.transparencies().push();
  }

  getLoginHref(): string {
    return routes.login().href;
  }
  getTransparencyReportsAnchorAttributes(transparency: Transparency) {
    return routes.reportList({
      transparency: GdsTransparenciesRoutesMapper.toPathSegment(transparency),
    }).link;
  }
  getReportOverviewAnchorAttributes(transparency: Transparency, id: string) {
    return routes.reportOverview({
      transparency: GdsTransparenciesRoutesMapper.toPathSegment(transparency),
      id,
    }).link;
  }
}
