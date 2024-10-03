import { FakeNominationCaseGateway } from "../../../adapters/secondary/gateways/FakeNominationCase.gateway";
import { AppState, NominationCase } from "../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { NominationCaseBuilder } from "../../builders/nominationCase.builder";
import { retrieveNominationCase } from "./retrieveNominationCase.use-case";

describe("Retrieve Nomination Case", () => {
  let store: ReduxStore;
  let nominationCaseGateway: FakeNominationCaseGateway;
  let initialState: AppState;

  beforeEach(() => {
    nominationCaseGateway = new FakeNominationCaseGateway();
    store = initReduxStore(
      {
        nominationCaseGateway,
      },
      {},
      {}
    );
    initialState = store.getState();
  });

  it("retrieve a nomination case", async () => {
    nominationCaseGateway.nominationCases["nomination-case-id"] = aNomination;
    await store.dispatch(retrieveNominationCase("nomination-case-id"));
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      nominationCaseOverview: { byIds: { [aNomination.id]: aNomination } },
    });
  });

  it("has two nomination cases in the store after retrieving a second one", async () => {
    nominationCaseGateway.nominationCases["nomination-case-id"] = aNomination;
    store.dispatch(retrieveNominationCase.fulfilled(anotherNomination, "", ""));

    await store.dispatch(retrieveNominationCase("nomination-case-id"));

    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      nominationCaseOverview: {
        byIds: {
          [aNomination.id]: aNomination,
          [anotherNomination.id]: anotherNomination,
        },
      },
    });
  });
});

const aNomination: NominationCase = new NominationCaseBuilder().build();

const anotherNomination = new NominationCaseBuilder()
  .withId("another-nomination-case-id")
  .build();
