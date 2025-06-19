import { Magistrat } from "shared-models";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import {
  dataAdministrationUpload,
  ImportTransparenceXlsxDto,
} from "../../../core-logic/use-cases/data-administration-upload/dataAdministrationUpload.use-case";
import { selectNouvelleTransparenceValidationError as selectValidationErrorCall } from "./selectNouvelleTransparenceValidationError";

describe("Select Validation Error", () => {
  let store: ReduxStore;
  let error: string | null;

  beforeEach(() => {
    store = initReduxStore({}, {}, {});
  });

  it("has no validation error if there is a rejected use case", () => {
    dispatchFulfilledUploadExcel();
    dispatchRejectedUploadExcel();
    selectValidationError();
    expectValidationError(null);
  });

  it("when upload is pending, the validation error is absent", () => {
    dispatchFulfilledUploadExcel();
    dispatchPendingUploadExcel();
    selectValidationError();
    expectValidationError(null);
  });

  it("when validation error is fulfilled, the validation error is absent", () => {
    dispatchFulfilledUploadExcel();
    selectValidationError();
    expectValidationError("validation error");
  });

  const dispatchRejectedUploadExcel = () =>
    store.dispatch(dataAdministrationUpload.rejected(new Error(), "", dto));

  const dispatchPendingUploadExcel = () =>
    store.dispatch(dataAdministrationUpload.pending("", dto));

  const dispatchFulfilledUploadExcel = () =>
    store.dispatch(
      dataAdministrationUpload.fulfilled(
        {
          validationError: "validation error",
        },
        "",
        dto,
      ),
    );

  const selectValidationError = () => {
    error = selectValidationErrorCall(store.getState());
  };

  const expectValidationError = (expected: string | null) =>
    expect(error).toBe(expected);
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
