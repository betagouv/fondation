import { createAppSelector } from "../../../nomination-file/store/createAppSelector";

export const selectLoginHref = createAppSelector(
  [(state) => state.router.hrefs],
  (hrefs) => hrefs.login,
);
