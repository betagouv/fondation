import { AllRulesMap, NominationFile } from "shared-models";
import { ConditionalExcept } from "type-fest";
import { ReportSM } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { ReportBuilderVM } from "../../../core-logic/builders/ReportVM.builder";
import { retrieveReport } from "../../../core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import {
  updateReportRule,
  UpdateReportRuleParams,
} from "../../../core-logic/use-cases/report-rule-update/updateReportRule.use-case";
import {
  GroupRulesChecked,
  ReportVM,
  VMReportRuleValue,
} from "../../../core-logic/view-models/ReportVM";
import { selectReport } from "./selectReport";
import { SummarySection } from "../labels/summary-labels";
import { reportHtmlIds } from "../dom/html-ids";

describe("Select Report", () => {
  let store: ReduxStore;
  let reportBuilder: ReportBuilder;

  const testRulesMap = {
    [NominationFile.RuleGroup.MANAGEMENT]: [
      NominationFile.ManagementRule.TRANSFER_TIME,
    ],
    [NominationFile.RuleGroup.STATUTORY]: [],
    [NominationFile.RuleGroup.QUALITATIVE]: [],
  } satisfies AllRulesMap;
  const summarySections: SummarySection[] = [
    { anchorId: reportHtmlIds.overview.biographySection, label: "Biographie" },
  ];

  const reportVMBuilder = (report: ReportSM) =>
    ReportBuilderVM.fromStoreModel<typeof testRulesMap>(
      report,
      summarySections,
    );

  beforeEach(() => {
    store = initReduxStore(
      {},
      {},
      {},
      undefined,
      undefined,
      testRulesMap,
      summarySections,
    );
    reportBuilder = new ReportBuilder(testRulesMap);
  });

  it("selects the whole report with rules unchecked", async () => {
    const aReport = reportBuilder
      .with("observers", [
        "observer 1",
        "observer 2\nVPI TJ Rennes\n(1 sur une liste de 2)",
      ])
      .with("rules.management.TRANSFER_TIME.validated", true)
      .with("rules.management.TRANSFER_TIME.preValidated", false)
      .with("attachedFiles", [
        { name: "test.pdf", signedUrl: "http://example.fr/test.pdf" },
      ])
      .buildRetrieveSM();
    givenAReport(aReport);

    const aRuleVM = givenATransferTimeRuleVM(aReport);
    const aReportVM = reportVMBuilder(aReport)
      .with("observers", [
        ["observer 1"],
        ["observer 2", "VPI TJ Rennes", "(1 sur une liste de 2)"],
      ])
      .with("rulesChecked.management.others.TRANSFER_TIME", aRuleVM)
      .build();
    expect(selectReport(store.getState(), aReport.id)).toEqual(aReportVM);
  });

  it("after checking a validation rule, it has its rule checked", () => {
    const aReport = reportBuilder
      .with("rules.management.TRANSFER_TIME.validated", true)
      .with("rules.management.TRANSFER_TIME.preValidated", false)
      .buildRetrieveSM();
    givenAReport(aReport);

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

    const aRuleVM = givenATransferTimeRuleVM(aReport);
    const aReportVM = reportVMBuilder(aReport)
      .with("rulesChecked.management.others.TRANSFER_TIME", aRuleVM)
      .build();

    expectReportVMToHaveRuleChecked(
      aReport.id,
      aReportVM,
      NominationFile.RuleGroup.MANAGEMENT,
      {
        selected: {
          TRANSFER_TIME: {
            ...aRuleVM,
            checked: true,
          },
        },
        others: {},
      },
    );
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

        const aHighlightedReportVMBuilder = reportVMBuilder(aHighlightedReport);

        const aRuleVM: VMReportRuleValue = {
          highlighted: expectHighlighted,
          checked: false,
          id: aHighlightedReport.rules.management.TRANSFER_TIME.id,
          label: ReportVM.rulesToLabels.management.TRANSFER_TIME,
          comment: null,
        };

        aHighlightedReportVMBuilder.with(
          `rulesChecked.management.${expectHighlighted ? "selected" : "others"}.TRANSFER_TIME`,
          aRuleVM,
        );

        const aHighlightedReportVM = aHighlightedReportVMBuilder.build();

        expectReportVMToHaveRuleChecked(
          aHighlightedReport.id,
          aHighlightedReportVM,
          NominationFile.RuleGroup.MANAGEMENT,
          {
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
        );
      },
    );
  });

  const givenATransferTimeRuleVM = (aReport: ReportSM) =>
    ({
      id: aReport.rules.management.TRANSFER_TIME.id,
      label: ReportVM.rulesToLabels.management.TRANSFER_TIME,
      checked: false,
      highlighted: false,
      comment: null,
    }) satisfies VMReportRuleValue;

  const expectReportVMToHaveRuleChecked = <
    G extends keyof ConditionalExcept<typeof testRulesMap, never[]>,
    RulesChecked extends Omit<
      GroupRulesChecked<G, (typeof testRulesMap)[G][number]>[G],
      "accordionLabel"
    >,
  >(
    reportId: string,
    reportVM: ReportVM,
    ruleGroup: G,
    rulesChecked: RulesChecked,
  ) => {
    expect(selectReport(store.getState(), reportId)).toEqual<
      ReportVM<typeof testRulesMap>
    >({
      ...reportVM,
      rulesChecked: {
        ...reportVM.rulesChecked,
        [ruleGroup]: {
          ...reportVM.rulesChecked[ruleGroup],
          ...rulesChecked,
        },
      },
    });
  };

  const givenAReport = (report: ReportSM) => {
    store.dispatch(retrieveReport.fulfilled(report, "", ""));
  };
});

describe("Select Report Summary", () => {
  let store: ReduxStore;
  let reportBuilder: ReportBuilder;

  const emptyTestRulesMap = {
    [NominationFile.RuleGroup.MANAGEMENT]: [],
    [NominationFile.RuleGroup.STATUTORY]: [],
    [NominationFile.RuleGroup.QUALITATIVE]: [],
  };
  const summarySections: SummarySection[] = [
    { anchorId: reportHtmlIds.overview.biographySection, label: "Biographie" },
    { anchorId: reportHtmlIds.overview.observersSection, label: "Observants" },
  ];
  const reportVMBuilder = (report: ReportSM) =>
    ReportBuilderVM.fromStoreModel<typeof emptyTestRulesMap>(
      report,
      summarySections,
    );

  beforeEach(() => {
    store = initReduxStore(
      {},
      {},
      {},
      undefined,
      undefined,
      emptyTestRulesMap,
      summarySections,
    );
    reportBuilder = new ReportBuilder(emptyTestRulesMap);
  });

  it("doesn't include observer section in summary if there are no observers", () => {
    const aReport = reportBuilder.with("observers", null).buildRetrieveSM();
    givenAReport(aReport);

    const aReportVM = reportVMBuilder(aReport)
      .with("observers", null)
      .with("summary", [summarySections[0]!])
      .build();
    expect(selectReport(store.getState(), aReport.id)).toEqual(aReportVM);
  });

  const givenAReport = (report: ReportSM) => {
    store.dispatch(retrieveReport.fulfilled(report, "", ""));
  };
});
