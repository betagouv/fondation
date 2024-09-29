import { NominationCaseBuilder } from "../../../core-logic/builders/nominationCase.builder";
import { retrieveNominationCase } from "../../../core-logic/use-cases/nomination-case-retrieval/retrieveNominationCase.use-case";
import {
  updateNominationRule,
  UpdateNominationRuleParams,
} from "../../../core-logic/use-cases/nomination-rule-update/updateNominationRule.use-case";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationCaseVM, selectNominationCase } from "./selectNominationCase";

describe("Select Nomination Case", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore();
    store.dispatch(retrieveNominationCase.fulfilled(aNominationCase, "", ""));
  });

  it("has all rules unchecked", async () => {
    expect(
      selectNominationCase(store.getState(), "nomination-case-id")
    ).toEqual(aNominationCaseVM);
  });

  it("after checking a validation  rule, it has its rule checked", () => {
    const updateNominationRuleParams: UpdateNominationRuleParams = {
      id: "nomination-case-id",
      ruleGroup: "managementRules",
      ruleName: "transferTime",
      validated: false,
    };
    store.dispatch(
      updateNominationRule.fulfilled(
        updateNominationRuleParams,
        "",
        updateNominationRuleParams
      )
    );

    expect(
      selectNominationCase(store.getState(), "nomination-case-id")
    ).toEqual<NominationCaseVM>({
      ...aNominationCaseVM,
      rulesChecked: {
        ...aNominationCaseVM.rulesChecked,
        managementRules: {
          ...aNominationCaseVM.rulesChecked.managementRules,
          transferTime: {
            ...aNominationCaseVM.rulesChecked.managementRules.transferTime,
            checked: true,
          },
        },
      },
    });
  });
});

const aNominationCase = new NominationCaseBuilder()
  .withId("nomination-case-id")
  .withName("John Doe")
  .withBiography("The biography.")
  .withTransferTimeValidated(true)
  .withGettingFirstGradeValidated(true)
  .withGettingGradeHHValidated(true)
  .withGettingGradeInPlaceValidated(true)
  .withProfiledPositionValidated(true)
  .withCassationCourtNominationValidated(true)
  .withOverseasToOverseasValidated(true)
  .withJudiciaryRoleAndJuridictionDegreeChangeValidated(true)
  .withJudiciaryRoleAndJuridictionDegreeChangeInSameRessortValidated(true)
  .build();
const aNominationCaseVM: NominationCaseVM = {
  id: "nomination-case-id",
  name: "John Doe",
  biography: "The biography.",
  rulesChecked: {
    managementRules: {
      transferTime: {
        label: "Transfer time",
        checked: false,
      },
      gettingFirstGrade: {
        label: "Getting first grade",
        checked: false,
      },
      gettingGradeHH: {
        label: "Getting grade HH",
        checked: false,
      },
      gettingGradeInPlace: {
        label: "Getting grade in place",
        checked: false,
      },
      profiledPosition: {
        label: "Profiled position",
        checked: false,
      },
      cassationCourtNomination: {
        label: "Cassation court nomination",
        checked: false,
      },
      overseasToOverseas: {
        label: "Overseas to overseas",
        checked: false,
      },
      judiciaryRoleAndJuridictionDegreeChange: {
        label: "Judiciary role and juridiction degree change",
        checked: false,
      },
      judiciaryRoleAndJuridictionDegreeChangeInSameRessort: {
        label: "Judiciary role and juridiction degree change in same ressort",
        checked: false,
      },
    },
  },
};
