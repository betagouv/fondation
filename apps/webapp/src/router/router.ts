import { createRouter, defineRoute, param } from "type-route";

export const { RouteProvider, useRoute, routes } = createRouter({
  home: defineRoute("/"),
  nominationCaseList: defineRoute("/dossiers-de-nomination"),
  nominationCaseOverview: defineRoute(
    {
      id: param.path.string,
    },
    (p) => `/dossiers-de-nomination/${p.id}`
  ),
});
