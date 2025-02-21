import { Transparency } from "shared-models";
import { RouterProvider } from "../../core-logic/providers/router";

import { createRouter, defineRoute, param } from "type-route";
import { GdsTransparenciesRoutesMapper } from "../../core-logic/models/gds-transparencies-routes-mapper";

export const routeSegments = {
  propositionduGardeDesSceaux: "pouvoir-de-proposition-du-garde-des-sceaux",
  transparences: "transparences",
  dossiersDeNomination: "dossiers-de-nomination",
  rapports: "rapports",
};

const { RouteProvider, useRoute, routes, session } = createRouter({
  login: defineRoute("/login"),
  transparencies: defineRoute([
    `/${routeSegments.transparences}`,
    `/${routeSegments.dossiersDeNomination}`,
  ]),
  reportList: defineRoute(
    {
      transparency: param.path.string,
    },
    (p) =>
      `/${routeSegments.transparences}/${routeSegments.propositionduGardeDesSceaux}/${p.transparency}/${routeSegments.rapports}`,
  ),
  reportOverview: defineRoute(
    {
      transparency: param.path.string,
      id: param.path.string,
    },
    (p) =>
      `/${routeSegments.transparences}/${routeSegments.propositionduGardeDesSceaux}/${p.transparency}/${routeSegments.rapports}/${p.id}`,
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
  getLoginAnchorAttributes() {
    return routes.login().link;
  }
  getTransparenciesAnchorAttributes() {
    return routes.transparencies().link;
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
