import { DateOnlyJson, Magistrat, Transparency } from "shared-models";
import { RouterProvider } from "../../core-logic/providers/router";

import { createRouter, defineRoute, param } from "type-route";
import { DateTransparenceRoutesMapper } from "../../core-logic/models/date-transparence-routes-mapper";
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
      dateTransparence: param.path.string,
    },
    (p) =>
      `/${routeSegments.transparences}/${routeSegments.propositionduGardeDesSceaux}/${p.dateTransparence}/${p.transparency}/${p.formation}/${routeSegments.rapports}`,
  ),
  reportOverview: defineRoute(
    {
      transparency: param.path.string,
      formation: param.path.string,
      dateTransparence: param.path.string,
      id: param.path.string,
    },
    (p) =>
      `/${routeSegments.transparences}/${routeSegments.propositionduGardeDesSceaux}/${p.dateTransparence}/${p.transparency}/${p.formation}/${routeSegments.rapports}/${p.id}`,
  ),

  secretariatGeneral: secretariatGeneralRoute,
  sgNouvelleTransparence: defineRoute(
    `/${routeSegments.sgNouvelleTransparence}`,
  ),
  sgTransparence: defineRoute(
    {
      id: param.path.string,
    },
    (p) => `/${routeSegments.sgTransparence}/session/${p.id}`,
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

  gotToSgTransparence(id: string) {
    routes.sgTransparence({ id }).push();
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
    dateTransparence: DateOnlyJson,
  ) {
    return routes.reportList({
      transparency: GdsTransparenciesRoutesMapper.toPathSegment(transparency),
      formation: FormationsRoutesMapper.toPathSegment(formation),
      dateTransparence:
        DateTransparenceRoutesMapper.toPathSegment(dateTransparence),
    }).link;
  }
  getReportOverviewAnchorAttributes(
    id: string,
    transparency: Transparency,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
  ) {
    return routes.reportOverview({
      transparency: GdsTransparenciesRoutesMapper.toPathSegment(transparency),
      formation: FormationsRoutesMapper.toPathSegment(formation),
      dateTransparence:
        DateTransparenceRoutesMapper.toPathSegment(dateTransparence),
      id,
    }).link;
  }

  goToSgDashboard() {
    routes.secretariatGeneral().push();
  }

  goToSgNouvelleTransparence() {
    routes.sgNouvelleTransparence().push();
  }

  getSecretariatGeneralAnchorAttributes() {
    return routes.secretariatGeneral().link;
  }
  getSgNouvelleTransparenceAnchorAttributes() {
    return routes.sgNouvelleTransparence().link;
  }
  getSgTransparenceAnchorAttributes(id: string) {
    return routes.sgTransparence({ id }).link;
  }
}
