import { createAppSelector } from "../../../../store/createAppSelector";

export const selectSecretariatGeneralAnchorAttributes = createAppSelector(
  (state) => state.router.anchorsAttributes.secretariatGeneral,
  (secretariatGeneral) => ({
    getDashboardAnchorAttributes: secretariatGeneral.dashboard,
    getNouvelleTransparenceAnchorAttributes:
      secretariatGeneral.sgNouvelleTransparence,
  }),
);
