import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { NominationFileBuilder } from "../../../core-logic/builders/NominationFile.builder";
import { NominationFileBuilderVM } from "../../../core-logic/builders/NominationFileVM.builder";
import { retrieveNominationFile } from "../../../core-logic/use-cases/nomination-file-retrieval/retrieveNominationFile.use-case";
import {
  updateNominationRule,
  UpdateNominationRuleParams,
} from "../../../core-logic/use-cases/nomination-rule-update/updateNominationRule.use-case";
import { NominationFileVM } from "../../../core-logic/view-models/NominationFileVM";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { selectNominationFile } from "./selectNominationFile";

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
      reportId: aNominationFile.id,
      ruleId: aNominationFile.rules.management.TRANSFER_TIME.id,
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
    .with("id", "nomination-file-id")
    .with("name", "John Doe")
    .with("dueDate", new DateOnly(2030, 10, 30))
    .with("biography", "The biography.")
    .with("observers", [
      "observer 1",
      "observer 2\nVPI TJ Rennes\n(1 sur une liste de 2)",
    ])
    .buildRetrieveVM();
  const aNominationFileVM = NominationFileBuilderVM.fromStoreModel(
    aNominationFile,
  )
    .withAllRulesChecked(false)
    .with("observers", [
      ["observer 1"],
      ["observer 2", "VPI TJ Rennes", "(1 sur une liste de 2)"],
    ])
    .build();
});
