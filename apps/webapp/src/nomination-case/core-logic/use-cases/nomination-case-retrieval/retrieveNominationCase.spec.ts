import { FakeNominationCaseGateway } from "../../../adapters/secondary/gateways/FakeNominationCase.gateway";
import { AppState } from "../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { retrieveNominationCase } from "./retrieveNominationCase.use-case";

describe("Retrieve Nomination Case", () => {
  let store: ReduxStore;
  let nominationCaseGateway: FakeNominationCaseGateway;
  let initialState: AppState;

  beforeEach(() => {
    nominationCaseGateway = new FakeNominationCaseGateway();
    store = initReduxStore({
      nominationCaseGateway,
    });
    initialState = store.getState();
  });

  it("retrieve a nomination case", async () => {
    nominationCaseGateway.nominationCases["nomination-case-id"] = aNomination;
    await store.dispatch(retrieveNominationCase("nomination-case-id"));
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      nominationCaseRetrieval: { byIds: { [aNomination.id]: aNomination } },
    });
  });

  it("has two nomination cases in the store after retrieving a second one", async () => {
    nominationCaseGateway.nominationCases["nomination-case-id"] = aNomination;
    store.dispatch(retrieveNominationCase.fulfilled(anotherNomination, "", ""));

    await store.dispatch(retrieveNominationCase("nomination-case-id"));

    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      nominationCaseRetrieval: {
        byIds: {
          [aNomination.id]: aNomination,
          [anotherNomination.id]: anotherNomination,
        },
      },
    });
  });
});

const aNomination = {
  id: "1",
  name: "John Doe",
  biography: "John Doe's biography",
  preValidatedRules: {
    overseasToOverseas: true,
  },
};

const anotherNomination = {
  id: "2",
  name: "Jane Doe",
  biography: "Jane Doe's biography",
  preValidatedRules: {
    overseasToOverseas: false,
  },
};
