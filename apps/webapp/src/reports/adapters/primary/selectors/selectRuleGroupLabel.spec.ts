import { AllRulesMapV2, NominationFile } from "shared-models";
import { Paths } from "type-fest";
import { ReportSM } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { retrieveReport } from "../../../core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import { selectRuleGroupLabel } from "./selectRuleGroupLabel";

describe("Select Report Rule Group Labels", () => {
  let store: ReduxStore;
  let reportBuilder: ReportBuilder;

  const testParams: {
    ruleGroup: NominationFile.RuleGroup;
    ruleName: NominationFile.RuleName;
    rulePath: Extract<Paths<ReportSM>, `rules.${string}.${string}.validated`>;
    description: string;
    validated: boolean;
    expectedLabel: string;
  }[] = [
    {
      ruleGroup: NominationFile.RuleGroup.MANAGEMENT,
      ruleName: NominationFile.ManagementRule.TRANSFER_TIME,
      rulePath: "rules.management.TRANSFER_TIME.validated",
      description: "validated",
      validated: true,
      expectedLabel: "Afficher les lignes directrices à vérifier",
    },
    {
      ruleGroup: NominationFile.RuleGroup.MANAGEMENT,
      ruleName: NominationFile.ManagementRule.TRANSFER_TIME,
      rulePath: "rules.management.TRANSFER_TIME.validated",
      description: "unvalidated",
      validated: false,
      expectedLabel: "Autres lignes directrices à vérifier",
    },
    {
      ruleGroup: NominationFile.RuleGroup.STATUTORY,
      ruleName: NominationFile.StatutoryRule.MINISTER_CABINET,
      rulePath: "rules.statutory.MINISTER_CABINET.validated",
      description: "validated",
      validated: true,
      expectedLabel: "Afficher les règles statutaires à vérifier",
    },
    {
      ruleGroup: NominationFile.RuleGroup.STATUTORY,
      ruleName: NominationFile.StatutoryRule.MINISTER_CABINET,
      rulePath: "rules.statutory.MINISTER_CABINET.validated",
      description: "unvalidated",
      validated: false,
      expectedLabel: "Autres règles statutaires à vérifier",
    },
    {
      ruleGroup: NominationFile.RuleGroup.QUALITATIVE,
      ruleName: NominationFile.QualitativeRule.EVALUATIONS,
      rulePath: "rules.qualitative.EVALUATIONS.validated",
      description: "validated",
      validated: true,
      expectedLabel: "Afficher les éléments qualitatifs à vérifier",
    },
    {
      ruleGroup: NominationFile.RuleGroup.QUALITATIVE,
      ruleName: NominationFile.QualitativeRule.EVALUATIONS,
      rulePath: "rules.qualitative.EVALUATIONS.validated",
      description: "unvalidated",
      validated: false,
      expectedLabel: "Autres éléments qualitatifs à vérifier",
    },
  ];
  describe.each(testParams)(
    "When the rule group $ruleGroup has all its rules $description",
    ({ ruleGroup, ruleName, rulePath, validated, expectedLabel }) => {
      let aReport: ReturnType<typeof reportBuilder.buildRetrieveSM>;
      let label: string | null;

      const testRulesMap = {
        [NominationFile.RuleGroup.MANAGEMENT]:
          ruleGroup === NominationFile.RuleGroup.MANAGEMENT
            ? [ruleName as NominationFile.ManagementRule]
            : [],
        [NominationFile.RuleGroup.STATUTORY]:
          ruleGroup === NominationFile.RuleGroup.STATUTORY
            ? [ruleName as NominationFile.StatutoryRule]
            : [],
        [NominationFile.RuleGroup.QUALITATIVE]:
          ruleGroup === NominationFile.RuleGroup.QUALITATIVE
            ? [ruleName as NominationFile.QualitativeRule]
            : [],
      } satisfies AllRulesMapV2;

      beforeEach(() => {
        store = initReduxStore({}, {}, {}, undefined, undefined, testRulesMap);
        reportBuilder = new ReportBuilder(testRulesMap);
      });

      it(`it selects the label:\n '${expectedLabel}'\n`, () => {
        aReport = reportBuilder.with(rulePath, validated).buildRetrieveSM();
        givenAStoredReport();

        selectLabel();

        expect(label).toEqual(expectedLabel);
      });

      const givenAStoredReport = () =>
        store.dispatch(retrieveReport.fulfilled(aReport, "", ""));

      const selectLabel = () => {
        label = selectRuleGroupLabel(store.getState(), {
          reportId: aReport.id,
          ruleGroup,
        });
      };
    },
  );
});
