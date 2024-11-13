import { createAppSelector } from "../../../reports/store/createAppSelector";

export const selectLoginHref = createAppSelector(
  [(state) => state.router.hrefs],
  (hrefs) => hrefs.login,
);
