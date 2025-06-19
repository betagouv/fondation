import { createAppSelector } from "../../../../store/createAppSelector";

export const selectNouvelleTransparenceValidationError = createAppSelector(
  [(state) => state.secretariatGeneral.nouvelleTransparence],
  (nouvelleTransparence) => nouvelleTransparence.validationError,
);
