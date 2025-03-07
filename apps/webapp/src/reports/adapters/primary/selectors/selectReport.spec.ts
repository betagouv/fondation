import { AllRulesMapV2, NominationFile, ReportFileUsage } from "shared-models";
import { ConditionalExcept } from "type-fest";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
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
import { reportHtmlIds } from "../dom/html-ids";
import { RulesLabelsMap } from "../labels/rules-labels";
import { SummarySection } from "../labels/summary-labels";
import { selectReport } from "./selectReport";

const summarySections: SummarySection[] = [
  { anchorId: reportHtmlIds.overview.biographySection, label: "Biographie" },
];

describe("Select Report", () => {
  let store: ReduxStore;
  let reportBuilder: ReportBuilder;

  describe("With one rule", () => {
    const testRulesMap = {
      [NominationFile.RuleGroup.MANAGEMENT]: [
        NominationFile.ManagementRule.TRANSFER_TIME,
      ],
      [NominationFile.RuleGroup.STATUTORY]: [],
      [NominationFile.RuleGroup.QUALITATIVE]: [],
    } satisfies AllRulesMapV2;
    const labelsRulesMap: RulesLabelsMap<typeof testRulesMap> = {
      [NominationFile.RuleGroup.MANAGEMENT]: {
        [NominationFile.ManagementRule.TRANSFER_TIME]: {
          label: "TRANSFER_TIME",
          hint: "Hint : TRANSFER_TIME",
        },
      },
      [NominationFile.RuleGroup.STATUTORY]: {},
      [NominationFile.RuleGroup.QUALITATIVE]: {},
    };

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
        labelsRulesMap,
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
          {
            usage: ReportFileUsage.ATTACHMENT,
            name: "test.pdf",
            signedUrl: "http://example.fr/test.pdf",
          },
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
      // On ne prend plus en compte "highlighted" car on teste
      // l'UX sans la pré-validation, en se laissant la possibilité
      // de le ré-introduire en fonction des retours utilisateurs.
      it.skip.each`
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
            reportVMBuilder(aHighlightedReport);

          const aRuleVM: VMReportRuleValue = {
            highlighted: expectHighlighted,
            checked: false,
            id: aHighlightedReport.rules.management.TRANSFER_TIME.id,
            label: labelsRulesMap.management.TRANSFER_TIME.label,
            hint: labelsRulesMap.management.TRANSFER_TIME.hint,
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
        label: labelsRulesMap.management.TRANSFER_TIME.label,
        hint: labelsRulesMap.management.TRANSFER_TIME.hint,
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
  });

  describe("Merge of JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE with JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT", () => {
    const testRulesMap = {
      [NominationFile.RuleGroup.MANAGEMENT]: [
        NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT,
      ],
      [NominationFile.RuleGroup.STATUTORY]: [],
      [NominationFile.RuleGroup.QUALITATIVE]: [],
    } satisfies AllRulesMapV2;

    const mergedReportVMBuilder = (report: ReportSM) =>
      ReportBuilderVM.fromStoreModel<typeof testRulesMap>(
        report,
        summarySections,
      );

    beforeEach(() => {
      store = initReduxStore({}, {}, {}, undefined, undefined, testRulesMap);
      reportBuilder = new ReportBuilder(testRulesMap);
    });

    // Les règles "highlighted" apparaissent dans la section "others"
    // car on teste l'UX sans la pré-validation, en se laissant la possibilité
    // de le ré-introduire en fonction des retours utilisateurs.
    it.each`
      description                                        | mergedRule                                   | rule                                         | expectedRule                             | isSelected
      ${"first rule not validated"}                      | ${{ validated: true, preValidated: false }}  | ${{ validated: false, preValidated: false }} | ${{ checked: true, highlighted: false }} | ${true}
      ${"second rule not validated"}                     | ${{ validated: false, preValidated: false }} | ${{ validated: true, preValidated: false }}  | ${{ checked: true, highlighted: false }} | ${true}
      ${"first rule not pre-validated"}                  | ${{ validated: true, preValidated: true }}   | ${{ validated: true, preValidated: false }}  | ${{ checked: false, highlighted: true }} | ${false}
      ${"second rule not pre-validated"}                 | ${{ validated: true, preValidated: false }}  | ${{ validated: true, preValidated: true }}   | ${{ checked: false, highlighted: true }} | ${false}
      ${"all rules not pre-validated and not validated"} | ${{ validated: false, preValidated: true }}  | ${{ validated: false, preValidated: true }}  | ${{ checked: true, highlighted: true }}  | ${true}
    `(
      "$description",
      async ({ mergedRule, rule, expectedRule, isSelected }) => {
        const aReport = new ReportBuilder(testRulesMap)
          .with(
            "rules.management.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE.validated",
            mergedRule.validated,
          )
          .with(
            "rules.management.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE.preValidated",
            mergedRule.preValidated,
          )
          .with(
            "rules.management.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT.validated",
            rule.validated,
          )
          .with(
            "rules.management.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT.preValidated",
            rule.preValidated,
          )
          .buildRetrieveSM();

        givenAReport(aReport);

        const aJudiciaryRoleChangeInSameRessortVM: VMReportRuleValue<true> = {
          id: aReport.rules.management.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT.id,
          label: "",
          hint: "",
          comment: null,
          ...expectedRule,
        };

        const aReportVM = mergedReportVMBuilder(aReport)
          .with(
            `rulesChecked.management.${isSelected ? "selected" : "others"}.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT`,
            aJudiciaryRoleChangeInSameRessortVM,
          )
          .build();
        expect(
          selectReport(store.getState(), aReport.id)?.rulesChecked,
        ).toEqual(aReportVM.rulesChecked);
      },
    );
  });

  const givenAReport = (report: ReportSM) => {
    store.dispatch(retrieveReport.fulfilled(report, "", ""));
  };
});

describe("Select Report - Summary and Age", () => {
  const currentDate = new DateOnly(2025, 10, 2);

  let store: ReduxStore;
  let reportBuilder: ReportBuilder;

  const emptyTestRulesMap = {
    [NominationFile.RuleGroup.MANAGEMENT]: [],
    [NominationFile.RuleGroup.STATUTORY]: [],
    [NominationFile.RuleGroup.QUALITATIVE]: [],
  } as const satisfies AllRulesMapV2;
  const emptyLabelsRulesMap: RulesLabelsMap<typeof emptyTestRulesMap> = {
    [NominationFile.RuleGroup.MANAGEMENT]: {},
    [NominationFile.RuleGroup.STATUTORY]: {},
    [NominationFile.RuleGroup.QUALITATIVE]: {},
  };

  const summarySections: SummarySection[] = [
    { anchorId: reportHtmlIds.overview.biographySection, label: "Biographie" },
    { anchorId: reportHtmlIds.overview.observersSection, label: "Observants" },
  ];
  const reportVMBuilder = (report: ReportSM) =>
    ReportBuilderVM.fromStoreModel<typeof emptyTestRulesMap>(
      report,
      summarySections,
      currentDate,
    );

  beforeEach(() => {
    store = initReduxStore(
      {},
      {},
      {},
      undefined,
      undefined,
      emptyTestRulesMap,
      emptyLabelsRulesMap,
      summarySections,
      currentDate.toDate(),
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

  describe("Age", () => {
    it.each`
      testName           | birthDate                    | expectedBirthDate
      ${"was yesterday"} | ${new DateOnly(2000, 10, 1)} | ${"01/10/2000 (25 ans)"}
      ${"is today"}      | ${new DateOnly(2000, 10, 2)} | ${"02/10/2000 (25 ans)"}
      ${"is tomorrow"}   | ${new DateOnly(2000, 10, 3)} | ${"03/10/2000 (24 ans)"}
    `(
      "selects the magistrate's age $expectedBirthDate when birthday $testName",
      ({ birthDate, expectedBirthDate }) => {
        const aReport = reportBuilder
          .with("birthDate", birthDate)
          .buildRetrieveSM();
        givenAReport(aReport);

        const aReportVM = reportVMBuilder(aReport)
          .with("birthDate", expectedBirthDate)
          .build();
        expect(selectReport(store.getState(), aReport.id)).toEqual(aReportVM);
      },
    );
  });

  /**
   * Test done for user display coherency,
   * even if we don't now the magistrate's birth date timezone.
   */
  it.each`
    timezone                 | currentDate
    ${"Paris standard time"} | ${new Date("2025-10-02T00:00:00+01:00")}
    ${"Paris summer time"}   | ${new Date("2025-10-02T00:00:00+02:00")}
  `(
    "handles $timezone timezone when computing birthdate",
    ({ currentDate }) => {
      const birthDate = new DateOnly(2000, 10, 2);
      store = initReduxStore(
        {},
        {},
        {},
        undefined,
        undefined,
        emptyTestRulesMap,
        emptyLabelsRulesMap,
        summarySections,
        currentDate,
      );

      const aReport = reportBuilder
        .with("birthDate", birthDate)
        .buildRetrieveSM();
      givenAReport(aReport);

      const aReportVM = reportVMBuilder(aReport)
        .with("birthDate", "02/10/2000 (25 ans)")
        .build();
      expect(selectReport(store.getState(), aReport.id)).toEqual(aReportVM);
    },
  );
});
