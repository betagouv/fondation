import { lazy } from "react";

export const LazyLogin = lazy(
  () => import("../../authentication/adapters/primary/components/Login"),
);
export const NominationFileListPage = lazy(
  () =>
    import(
      "../../nomination-file/adapters/primary/components/NominationFileList/NominationFileListPage"
    ),
);
export const LazyNominationFileOverview = lazy(
  () =>
    import(
      "../../nomination-file/adapters/primary/components/NominationFileOverview/NominationFileOverview"
    ),
);
