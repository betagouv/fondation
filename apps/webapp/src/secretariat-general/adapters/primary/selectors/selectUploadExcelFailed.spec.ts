import { Magistrat } from "shared-models";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import {
  dataAdministrationUpload,
  ImportTransparenceXlsxDto,
} from "../../../core-logic/use-cases/data-administration-upload/dataAdministrationUpload.use-case";
import { selectUploadExcelFailed } from "./selectUploadExcelFailed";

describe("Select UploadExcel Failed", () => {
  let store: ReduxStore;
  let isFailed: boolean;

  beforeEach(() => {
    store = initReduxStore({}, {}, {});
  });

  it("selects the authentication failed state", () => {
    selectIsFailed();
    expectIsFailed(false);
  });

  it("selects a failed authentication", () => {
    dispatchRejectedUploadExcel();
    selectIsFailed();
    expectIsFailed(true);
  });

  it("when authentication is pending, it says the authentication isn't failed", () => {
    dispatchPendingUploadExcel();
    selectIsFailed();
    expectIsFailed(false);
  });

  it("when authentication is fulfilled, it says the authentication isn't failed", () => {
    dispatchFulfilledUploadExcel();
    selectIsFailed();
    expectIsFailed(false);
  });

  const dispatchPendingUploadExcel = () =>
    store.dispatch(dataAdministrationUpload.pending("", dto));

  const dispatchFulfilledUploadExcel = () =>
    store.dispatch(dataAdministrationUpload.fulfilled(void 0, "", dto));

  const dispatchRejectedUploadExcel = () =>
    store.dispatch(dataAdministrationUpload.rejected(new Error(), "", dto));

  const selectIsFailed = () => {
    isFailed = selectUploadExcelFailed(store.getState());
  };

  const expectIsFailed = (expected: boolean) => expect(isFailed).toBe(expected);
});

const dto: ImportTransparenceXlsxDto = {
  dateClotureDelaiObservation: "2024-01-05",
  dateEcheance: "2023-01-01",
  datePriseDePosteCible: "2024-01-01",
  dateTransparence: "2023-01-01",
  fichier: new File([""], "transparence.xlsx"),
  formation: Magistrat.Formation.SIEGE,
  nomTransparence: "Balai",
};
