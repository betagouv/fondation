import { FakeNominationCaseGateway } from "../../../adapters/secondary/gateways/FakeNominationCase.gateway";
import { AppState } from "../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationCaseBuilder } from "../../builders/nominationCase.builder";
import { listNominationCase } from "./listNominationCase.use-case";

describe("Nomination Cases Listing", () => {
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

  it("list a nomination case", async () => {
    nominationCaseGateway.nominationCases["nomination-case-id"] =
      new NominationCaseBuilder()
        .withId("nomination-case-id")
        .withName("Lucien Denan")
        .build();
    await store.dispatch(listNominationCase());

    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      nominationCaseList: {
        data: [{ id: "nomination-case-id", name: "Lucien Denan" }],
      },
    });
  });
});
