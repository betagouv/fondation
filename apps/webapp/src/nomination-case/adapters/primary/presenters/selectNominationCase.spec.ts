import { retrieveNominationCase } from "../../../core-logic/use-cases/nomination-case-retrieval/retrieveNominationCase.use-case";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationCaseVM, selectNominationCase } from "./selectNominationCase";

describe("Select Nomination Case", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore();
    store.dispatch(
      retrieveNominationCase.fulfilled(
        {
          id: "nomination-case-id",
          name: "John Doe",
          biography: "The biography.",
          preValidatedRules: {
            overseasToOverseas: true,
          },
        },
        "",
        ""
      )
    );
  });

  it("select a nomination case", async () => {
    expect(
      selectNominationCase(store.getState(), "nomination-case-id")
    ).toEqual(aNominationCaseVM);
  });
});

const aNominationCaseVM: NominationCaseVM = {
  id: "nomination-case-id",
  name: "John Doe",
  biography: "The biography.",
  rulesChecked: {
    overseasToOverseas: false,
  },
};
