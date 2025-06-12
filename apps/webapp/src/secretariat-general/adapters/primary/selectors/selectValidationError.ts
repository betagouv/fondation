import { createAppSelector } from "../../../../store/createAppSelector";

export const selectValidationError = createAppSelector(
  [(state) => state.secretariatGeneral.nouvelleTransparence],
  (nouvelleTransparence) => nouvelleTransparence.validationError,
);
