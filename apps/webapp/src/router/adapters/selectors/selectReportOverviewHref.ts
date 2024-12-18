import { createAppSelector } from "../../../store/createAppSelector";

export const selectReportListHref = createAppSelector(
  [(state) => state.router.hrefs],
  (hrefs): string => hrefs.reportList,
);
