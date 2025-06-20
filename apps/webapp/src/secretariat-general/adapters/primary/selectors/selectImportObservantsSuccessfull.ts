import { createAppSelector } from "../../../../store/createAppSelector";

export const selectImportObservantsSuccessfull = createAppSelector(
  [(state) => state.secretariatGeneral.importObservants.uploadQueryStatus],
  (queryStatus) => queryStatus === "fulfilled",
);
