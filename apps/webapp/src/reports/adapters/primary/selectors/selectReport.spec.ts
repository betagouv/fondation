import { NominationFile } from "shared-models";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { ReportBuilderVM } from "../../../core-logic/builders/ReportVM.builder";
import { retrieveReport } from "../../../core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import {
  updateReportRule,
  UpdateReportRuleParams,
} from "../../../core-logic/use-cases/report-rule-update/updateReportRule.use-case";
import {
  ReportVM,
  VMReportRuleValue,
} from "../../../core-logic/view-models/ReportVM";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { selectReport } from "./selectReport";

const testRulesMap = {
  [NominationFile.RuleGroup.MANAGEMENT]: [
    NominationFile.ManagementRule.TRANSFER_TIME,
  ],
  [NominationFile.RuleGroup.STATUTORY]: [],
  [NominationFile.RuleGroup.QUALITATIVE]: [],
};

describe("Select Report", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore({}, {}, {}, undefined, undefined, testRulesMap);
    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
  });

  it("selects the whole report with rules unchecked", async () => {
    expect(selectReport(store.getState(), aReport.id)).toEqual(aReportVM);
  });

  it("after checking a validation rule, it has its rule checked", () => {
    const updateReportRuleParams: UpdateReportRuleParams = {
      reportId: aReport.id,
      ruleId: aReport.rules.management.TRANSFER_TIME.id,
      validated: false,
    };
    store.dispatch(
      updateReportRule.fulfilled(
        updateReportRuleParams,
        "",
        updateReportRuleParams,
      ),
    );

    expect(selectReport(store.getState(), aReport.id)).toEqual<
      ReportVM<typeof testRulesMap>
    >({
      ...aReportVM,
      rulesChecked: {
        ...aReportVM.rulesChecked,
        management: {
          ...aReportVM.rulesChecked[NominationFile.RuleGroup.MANAGEMENT],
          selected: {
            TRANSFER_TIME: {
              ...aRuleVM,
              checked: true,
            },
          },
          others: {},
        },
        [NominationFile.RuleGroup.STATUTORY]: {
          ...aReportVM.rulesChecked[NominationFile.RuleGroup.STATUTORY],
          selected: {},
          others: {},
        },
        [NominationFile.RuleGroup.QUALITATIVE]: {
          ...aReportVM.rulesChecked[NominationFile.RuleGroup.QUALITATIVE],
          selected: {},
          others: {},
        },
      },
    });
  });

  describe("Pre validation", () => {
    it.each`
      testName               | preValidated | expectHighlighted
      ${"highlights"}        | ${true}      | ${true}
      ${"doesn't highlight"} | ${false}     | ${false}
    `(
      "puts a higlighted rule in the selected section",
      ({ preValidated, expectHighlighted }) => {
        const aHighlightedReport = new ReportBuilder(testRulesMap)
          .with("id", "highlight-test-report-id")
          .with("rules.management.TRANSFER_TIME.preValidated", preValidated)
          .with("rules.management.TRANSFER_TIME.validated", true)
          .buildRetrieveSM();
        store.dispatch(retrieveReport.fulfilled(aHighlightedReport, "", ""));

        const aHighlightedReportVMBuilder =
          ReportBuilderVM.fromStoreModel<typeof testRulesMap>(
            aHighlightedReport,
          );

        const aRuleVM: VMReportRuleValue = {
          highlighted: expectHighlighted,
          checked: false,
          id: aHighlightedReport.rules.management.TRANSFER_TIME.id,
          label: ReportVM.rulesToLabels.management.TRANSFER_TIME,
          comment: null,
        };

        if (expectHighlighted) {
          aHighlightedReportVMBuilder.with(
            "rulesChecked.management.selected.TRANSFER_TIME",
            aRuleVM as VMReportRuleValue<true>,
          );
        } else {
          aHighlightedReportVMBuilder.with(
            "rulesChecked.management.others.TRANSFER_TIME",
            aRuleVM as VMReportRuleValue<false>,
          );
        }

        const aHighlightedReportVM = aHighlightedReportVMBuilder.build();

        expect(selectReport(store.getState(), aHighlightedReport.id)).toEqual<
          ReportVM<typeof testRulesMap>
        >({
          ...aHighlightedReportVM,
          rulesChecked: {
            ...aHighlightedReportVM.rulesChecked,
            [NominationFile.RuleGroup.MANAGEMENT]: {
              ...aHighlightedReportVM.rulesChecked[
                NominationFile.RuleGroup.MANAGEMENT
              ],
              selected: expectHighlighted
                ? {
                    TRANSFER_TIME: aRuleVM as VMReportRuleValue<true>,
                  }
                : {},
              others: expectHighlighted
                ? {}
                : {
                    TRANSFER_TIME: aRuleVM as VMReportRuleValue<false>,
                  },
            },
            [NominationFile.RuleGroup.STATUTORY]: {
              ...aHighlightedReportVM.rulesChecked[
                NominationFile.RuleGroup.STATUTORY
              ],
              selected: {},
              others: {},
            },
            [NominationFile.RuleGroup.QUALITATIVE]: {
              ...aHighlightedReportVM.rulesChecked[
                NominationFile.RuleGroup.QUALITATIVE
              ],
              selected: {},
              others: {},
            },
          },
        });
      },
    );
  });

  const aReport = new ReportBuilder()
    .with("id", "report-id")
    .with("name", "John Doe")
    .with("dueDate", new DateOnly(2030, 10, 30))
    .with("biography", "The biography.")
    .with("observers", [
      "observer 1",
      "observer 2\nVPI TJ Rennes\n(1 sur une liste de 2)",
    ])
    .with("rules.management.TRANSFER_TIME", {
      id: "transfer-time-id",
      preValidated: false,
      validated: true,
      comment: null,
    })
    .with("attachedFiles", [
      { name: "test.pdf", signedUrl: "http://example.fr/test.pdf" },
    ])
    .buildRetrieveSM();

  const aRuleVM: VMReportRuleValue = {
    id: "transfer-time-id",
    label: ReportVM.rulesToLabels.management.TRANSFER_TIME,
    highlighted: false,
    checked: false,
    comment: null,
  };

  const aReportVM = ReportBuilderVM.fromStoreModel<typeof testRulesMap>(aReport)
    .with("state", NominationFile.ReportState.NEW)
    .with("rulesChecked.management.others.TRANSFER_TIME", aRuleVM)
    .with("observers", [
      ["observer 1"],
      ["observer 2", "VPI TJ Rennes", "(1 sur une liste de 2)"],
    ])
    .build();
});
