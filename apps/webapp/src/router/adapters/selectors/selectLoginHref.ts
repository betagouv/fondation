import { createAppSelector } from "../../../nomination-case/store/createAppSelector";

export const selectLoginHref = createAppSelector(
  [(state) => state.router.hrefs],
  (hrefs) => hrefs.login
);
