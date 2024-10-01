import { createRouter, defineRoute, param } from "type-route";

const routeSegments = {
  dossierDeNomination: "dossiers-de-nomination",
};

export const { RouteProvider, useRoute, routes, session } = createRouter({
  login: defineRoute(["/login", "/"]),
  nominationCaseList: defineRoute(`/${routeSegments.dossierDeNomination}`),
  nominationCaseOverview: defineRoute(
    {
      id: param.path.string,
    },
    (p) => `/${routeSegments.dossierDeNomination}/${p.id}`
  ),
});
