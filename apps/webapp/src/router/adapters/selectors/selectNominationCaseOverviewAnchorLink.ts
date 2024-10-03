import { AppState } from "../../../nomination-case/store/appState";
import { createAppSelector } from "../../../nomination-case/store/createAppSelector";

export const selectNominationCaseOverviewAnchorLink = createAppSelector(
  [
    (state) => state.router.anchorsAttributes.nominationCaseOverview,
    (_, ids: string[]) => ids,
  ],
  (
    nominationCaseOverview,
    ids
  ): Record<
    string,
    ReturnType<
      AppState["router"]["anchorsAttributes"]["nominationCaseOverview"]
    >
  > =>
    ids.reduce((acc, id) => ({ ...acc, [id]: nominationCaseOverview(id) }), {})
);
