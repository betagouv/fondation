import { NominationFileBuilder } from "../../../core-logic/builders/NominationFile.builder";
import { NominationFileBuilderVM } from "../../../core-logic/builders/NominationFileVM.builder";
import { retrieveNominationFile } from "../../../core-logic/use-cases/nomination-file-retrieval/retrieveNominationFile.use-case";
import {
  updateNominationRule,
  UpdateNominationRuleParams,
} from "../../../core-logic/use-cases/nomination-rule-update/updateNominationRule.use-case";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationFileVM, selectNominationFile } from "./selectNominationFile";

describe("Select Nomination Case", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore({}, {}, {});
    store.dispatch(retrieveNominationFile.fulfilled(aNominationFile, "", ""));
  });

  it("has all rules unchecked", async () => {
    expect(
      selectNominationFile(store.getState(), "nomination-file-id"),
    ).toEqual(aNominationFileVM);
  });

  it("after checking a validation  rule, it has its rule checked", () => {
    const updateNominationRuleParams: UpdateNominationRuleParams = {
      id: "nomination-file-id",
      ruleGroup: "management",
      ruleName: "TRANSFER_TIME",
      validated: false,
    };
    store.dispatch(
      updateNominationRule.fulfilled(
        updateNominationRuleParams,
        "",
        updateNominationRuleParams,
      ),
    );

    expect(
      selectNominationFile(store.getState(), "nomination-file-id"),
    ).toEqual<NominationFileVM>({
      ...aNominationFileVM,
      rulesChecked: {
        ...aNominationFileVM.rulesChecked,
        management: {
          ...aNominationFileVM.rulesChecked.management,
          TRANSFER_TIME: {
            ...aNominationFileVM.rulesChecked.management.TRANSFER_TIME,
            checked: true,
          },
        },
      },
    });
  });

  const aNominationFile = new NominationFileBuilder()
    .withId("nomination-file-id")
    .withTitle("John Doe")
    .withDueDate("2030-10-30")
    .withBiography("The biography.")
    .build();
  const aNominationFileVM: NominationFileVM = new NominationFileBuilderVM()
    .withId("nomination-file-id")
    .withTitle("John Doe")
    .withDueDate("2030-10-30")
    .withBiography("The biography.")
    .build();
});
