import { createAppSelector } from "../../../../store/createAppSelector";

export const selectImportObservantsValidationError = createAppSelector(
  [(state) => state.secretariatGeneral.importObservants],
  (importObservants) => importObservants.validationError,
);
