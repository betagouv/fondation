import { FakeNominationCaseGateway } from "../../../adapters/secondary/gateways/FakeNominationCase.gateway";
import { AppState, NominationCase } from "../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationCaseBuilder } from "../../builders/nominationCase.builder";
import { retrieveNominationCase } from "../nomination-case-retrieval/retrieveNominationCase.use-case";
import { updateNominationRule } from "./updateNominationRule.use-case";

describe("Nomination Rule Update", () => {
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

  it("switch the transfer time rule from unvalidated to validated", async () => {
    nominationCaseGateway.nominationCases["nomination-case-id"] = aNomination;
    store.dispatch(retrieveNominationCase.fulfilled(aNomination, "", ""));
    await store.dispatch(
      updateNominationRule({
        id: "nomination-case-id",
        ruleGroup: "managementRules",
        ruleName: "transferTime",
        validated: true,
      })
    );
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      nominationCaseOverview: {
        byIds: {
          [aNomination.id]: {
            ...aNomination,
            preValidatedRules: {
              ...aNomination.preValidatedRules,
              managementRules: {
                ...aNomination.preValidatedRules.managementRules,
                transferTime: true,
              },
            },
          },
        },
      },
    });
  });
});

const aNomination: NominationCase = new NominationCaseBuilder()
  .withTransferTimeValidated(false)
  .build();
