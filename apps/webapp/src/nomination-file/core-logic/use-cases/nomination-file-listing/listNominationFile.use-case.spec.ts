import { FakeNominationFileGateway } from "../../../adapters/secondary/gateways/FakeNominationFile.gateway";
import { AppState } from "../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationFileBuilder } from "../../builders/NominationFile.builder";
import { listNominationFile } from "./listNominationFile.use-case";

describe("Nomination Files Listing", () => {
  let store: ReduxStore;
  let nominationCaseGateway: FakeNominationFileGateway;
  let initialState: AppState;

  beforeEach(() => {
    nominationCaseGateway = new FakeNominationFileGateway();
    store = initReduxStore(
      {
        nominationCaseGateway,
      },
      {},
      {}
    );
    initialState = store.getState();
  });

  it("lists a nomination file", async () => {
    nominationCaseGateway.nominationFiles["nomination-file-id"] =
      new NominationFileBuilder()
        .withId("nomination-file-id")
        .withTitle("Lucien Denan")
        .withDueDate("2030-10-30")
        .build();

    await store.dispatch(listNominationFile());

    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      nominationCaseList: {
        data: [
          {
            id: "nomination-file-id",
            title: "Lucien Denan",
            dueDate: "2030-10-30",
          },
        ],
      },
    });
  });
});
