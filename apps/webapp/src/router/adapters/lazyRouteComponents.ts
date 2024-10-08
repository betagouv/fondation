import { lazy } from "react";

export const LazyLogin = lazy(
  () => import("../../authentication/adapters/primary/components/Login")
);
export const LazyNominationFileList = lazy(
  () =>
    import(
      "../../nomination-file/adapters/primary/components/NominationFileList/NominationFileList"
    )
);
export const LazyNominationFileOverview = lazy(
  () =>
    import(
      "../../nomination-file/adapters/primary/components/NominationFileOverview/NominationFileOverview"
    )
);
