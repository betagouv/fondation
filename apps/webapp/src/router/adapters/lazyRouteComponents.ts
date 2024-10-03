import { lazy } from "react";

export const LazyLogin = lazy(
  () => import("../../authentication/adapters/primary/components/Login")
);
export const LazyNominationCaseList = lazy(
  () =>
    import(
      "../../nomination-case/adapters/primary/components/NominationCaseList/NominationCaseList"
    )
);
export const LazyNominationCaseOverview = lazy(
  () =>
    import(
      "../../nomination-case/adapters/primary/components/NominationCaseOverview/NominationCaseOverview"
    )
);
