import { createAppSelector } from "../../../../store/createAppSelector";

export const selectUploadExcelFailed = createAppSelector(
  [(state) => state.secretariatGeneral.nouvelleTransparence.uploadQueryStatus],
  (queryStatus) => queryStatus === "rejected",
);
