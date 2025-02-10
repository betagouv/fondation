import { Transparency } from "shared-models";
import { RouterProvider } from "../../core-logic/providers/router";

import { createRouter, defineRoute, param } from "type-route";

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
      name: param.path.string,
    },
    (p) =>
      `/${routeSegments.transparences}/${p.transparency}/${routeSegments.dossierDeNomination}/${p.name}`,
  ),
});

// React adapter
export { RouteProvider, routes, useRoute, session as sessionForTestingPurpose };

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
  getReportListHref(transparency: Transparency): string {
    return routes.reportList({
      transparency: this.transparencyToPathSegment(transparency),
    }).href;
  }
  getTransparenciesHref(): string {
    return routes.transparencies().href;
  }

  getReportOverviewAnchorAttributes(transparency: Transparency, name: string) {
    return routes.reportOverview({
      transparency: this.transparencyToPathSegment(transparency),
      name,
    }).link;
  }

  private transparencyToPathSegment(transparency: Transparency): string {
    switch (transparency) {
      case Transparency.AUTOMNE_2024:
        return "automne-2024";
      case Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024:
        return "procureurs-generaux-8-novembre-2024";
      case Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024:
        return "procureurs-generaux-25-novembre-2024";
      case Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024:
        return "tableau-general-t-du-25-novembre-2024";
      case Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025:
        return "cabinet-du-ministre-du-21-janvier-2025";
      case Transparency.SIEGE_DU_06_FEVRIER_2025:
        return "siege-du-06-fevrier-2025";
      case Transparency.PARQUET_DU_06_FEVRIER_2025:
        return "parquet-du-06-fevrier-2025";
      case Transparency.MARCH_2025:
        return "march-2025";
      case Transparency.MARCH_2026:
        return "march-2026";
      default: {
        const _exhaustiveCheck: never = transparency;
        console.info(_exhaustiveCheck);
        throw new Error(
          `Unhandled transparency: ${JSON.stringify(transparency)}`,
        );
      }
    }
  }
}
