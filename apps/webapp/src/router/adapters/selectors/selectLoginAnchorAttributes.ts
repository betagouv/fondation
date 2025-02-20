import { createAppSelector } from "../../../store/createAppSelector";

export const selectLoginAnchorAttributes = createAppSelector(
  [(state) => state.router.anchorsAttributes.login],
  (getLoginAnchorAttributes) => getLoginAnchorAttributes(),
);
