import { Magistrat, Transparency } from "shared-models";
import { RouterProvider } from "../../core-logic/providers/router";

import { createRouter, defineRoute, param } from "type-route";
import { FormationsRoutesMapper } from "../../core-logic/models/formations-routes-mapper";
import { GdsTransparenciesRoutesMapper } from "../../core-logic/models/gds-transparencies-routes-mapper";
import { routeSegments } from "../../core-logic/models/routeSegments";

const secretariatGeneralRoute = defineRoute(
  `/${routeSegments.secretariatGeneral}`,
);

const { RouteProvider, useRoute, routes, session } = createRouter({
  login: defineRoute("/login"),
  transparencies: defineRoute([
    `/${routeSegments.transparences}`,
    `/${routeSegments.dossiersDeNomination}`,
  ]),
  reportList: defineRoute(
    {
      transparency: param.path.string,
      formation: param.path.string,
    },
    (p) =>
      `/${routeSegments.transparences}/${routeSegments.propositionduGardeDesSceaux}/${p.transparency}/${p.formation}/${routeSegments.rapports}`,
  ),
  reportOverview: defineRoute(
    {
      transparency: param.path.string,
      id: param.path.string,
    },
    (p) =>
      `/${routeSegments.transparences}/${routeSegments.propositionduGardeDesSceaux}/${p.transparency}/${routeSegments.rapports}/${p.id}`,
  ),
  secretariatGeneral: secretariatGeneralRoute,
  sgNouvelleTransparence: defineRoute(
    `/${routeSegments.sgNouvelleTransparence}`,
  ),
});

// React adapter
export { RouteProvider, session as sessionForTestingPurpose, useRoute };

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
  getTransparencyReportsAnchorAttributes(
    transparency: Transparency,
    formation: Magistrat.Formation,
  ) {
    return routes.reportList({
      transparency: GdsTransparenciesRoutesMapper.toPathSegment(transparency),
      formation: FormationsRoutesMapper.toPathSegment(formation),
    }).link;
  }
  getReportOverviewAnchorAttributes(transparency: Transparency, id: string) {
    return routes.reportOverview({
      transparency: GdsTransparenciesRoutesMapper.toPathSegment(transparency),
      id,
    }).link;
  }

  goToSecretariatGeneral() {
    routes.secretariatGeneral().push();
  }

  getSecretariatGeneralAnchorAttributes() {
    return routes.secretariatGeneral().link;
  }

  goToSgNouvelleTransparence() {
    routes.sgNouvelleTransparence().push();
  }

  getSgNouvelleTransparenceAnchorAttributes() {
    return routes.sgNouvelleTransparence().link;
  }
}
