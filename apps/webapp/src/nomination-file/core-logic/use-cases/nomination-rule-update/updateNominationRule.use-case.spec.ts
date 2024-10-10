import { FakeNominationFileGateway } from "../../../adapters/secondary/gateways/FakeNominationFile.gateway";
import { AppState, NominationFile } from "../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationFileBuilder } from "../../builders/NominationFile.builder";
import { retrieveNominationFile } from "../nomination-file-retrieval/retrieveNominationFile.use-case";
import { updateNominationRule } from "./updateNominationRule.use-case";

describe("Nomination Rule Update", () => {
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
      {},
    );
    initialState = store.getState();
  });

  it("switch the transfer time rule from unvalidated to validated", async () => {
    nominationCaseGateway.nominationFiles["nomination-file-id"] = aNomination;
    store.dispatch(retrieveNominationFile.fulfilled(aNomination, "", ""));
    await store.dispatch(
      updateNominationRule({
        id: "nomination-file-id",
        ruleGroup: "management",
        ruleName: "TRANSFER_TIME",
        validated: true,
      }),
    );
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      nominationFileOverview: {
        byIds: {
          [aNomination.id]: {
            ...aNomination,
            rules: {
              ...aNomination.rules,
              management: {
                ...aNomination.rules.management,
                TRANSFER_TIME: true,
              },
            },
          },
        },
      },
    });
  });
});

const aNomination: NominationFile = new NominationFileBuilder()
  .withTransferTimeValidated(false)
  .build();
