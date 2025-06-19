import { createAppSelector } from "../../../../store/createAppSelector";

export const selectImportObservantsFailed = createAppSelector(
  [(state) => state.secretariatGeneral.importObservants.uploadQueryStatus],
  (queryStatus) => queryStatus === "rejected",
);
