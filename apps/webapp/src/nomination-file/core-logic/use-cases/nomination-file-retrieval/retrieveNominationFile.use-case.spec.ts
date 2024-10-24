import { FakeNominationFileGateway } from "../../../adapters/secondary/gateways/FakeNominationFile.gateway";
import { AppState } from "../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { NominationFileBuilder } from "../../builders/NominationFile.builder";
import { retrieveNominationFile } from "./retrieveNominationFile.use-case";

describe("Retrieve Nomination Case", () => {
  let store: ReduxStore;
  let nominationCaseGateway: FakeNominationFileGateway;
  let initialState: AppState;

  beforeEach(() => {
    nominationCaseGateway = new FakeNominationFileGateway();
    store = initReduxStore(
      {
        nominationFileGateway: nominationCaseGateway,
      },
      {},
      {},
    );
    initialState = store.getState();
  });

  it("retrieve a nomination file", async () => {
    nominationCaseGateway.addNominationFile(aNomination);
    await store.dispatch(retrieveNominationFile("nomination-file-id"));
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      nominationFileOverview: { byIds: { [aNomination.id]: aNomination } },
    });
  });

  it("has two nomination cases in the store after retrieving a second one", async () => {
    nominationCaseGateway.addNominationFile(aNomination);
    store.dispatch(retrieveNominationFile.fulfilled(anotherNomination, "", ""));

    await store.dispatch(retrieveNominationFile("nomination-file-id"));

    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      nominationFileOverview: {
        byIds: {
          [aNomination.id]: aNomination,
          [anotherNomination.id]: anotherNomination,
        },
      },
    });
  });
});

const aNomination = new NominationFileBuilder().build();

const anotherNomination = new NominationFileBuilder()
  .withId("another-nomination-file-id")
  .build();
