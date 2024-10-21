import { createAppSelector } from "../../../nomination-file/store/createAppSelector";

export const selectNominationFileListHref = createAppSelector(
  [(state) => state.router.hrefs],
  (hrefs): string => hrefs.nominationFileList,
);
