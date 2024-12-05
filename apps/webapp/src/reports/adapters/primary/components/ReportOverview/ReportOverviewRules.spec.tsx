import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { AllRulesMap, NominationFile } from "shared-models";
import {
  ReportApiModel,
  ReportApiModelBuilder,
} from "../../../../core-logic/builders/ReportApiModel.builder";
import { getReportAccordionLabel } from "../../../../core-logic/builders/ReportVMRules.builder";
import { reportFileAttached } from "../../../../core-logic/listeners/report-file-attached.listeners";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { ReportOverview } from "./ReportOverview";

describe("Report Overview Component - Rules use cases", () => {
  let store: ReduxStore;
  let reportApiClient: FakeReportApiClient;
  let reportGateway: ApiReportGateway;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    reportGateway = new ApiReportGateway(reportApiClient);
    store = initStore();
  });

  it("shows a message to explain rules checked and red meaning", async () => {
    const aReport = new ReportApiModelBuilder().build();
    renderReport(aReport);

    const messages = await screen.findAllByText(
      "Case cochée = la règle n'est pas respectée. Si le texte est rouge, cela signifie que notre outil de pré-analyse a détecté un risque de non-respect de la règle.",
    );
    expect(messages).toHaveLength(2);
  });

  describe.each([
    {
      testName: "Management rule",
      ruleGroup: NominationFile.RuleGroup.MANAGEMENT,
      testRulesMap: {
        [NominationFile.RuleGroup.MANAGEMENT]: [
          NominationFile.ManagementRule.TRANSFER_TIME,
        ],
        [NominationFile.RuleGroup.STATUTORY]: [],
        [NominationFile.RuleGroup.QUALITATIVE]: [],
      } as const satisfies AllRulesMap,
      testedRuleBuilderPath: `rules.${NominationFile.RuleGroup.MANAGEMENT}.${NominationFile.ManagementRule.TRANSFER_TIME}`,
      ruleLabel:
        ReportVM.rulesToLabels[NominationFile.RuleGroup.MANAGEMENT][
          NominationFile.ManagementRule.TRANSFER_TIME
        ],
    },
    {
      testName: "Statutory rule",
      ruleGroup: NominationFile.RuleGroup.STATUTORY,
      testRulesMap: {
        [NominationFile.RuleGroup.MANAGEMENT]: [],
        [NominationFile.RuleGroup.STATUTORY]: [
          NominationFile.StatutoryRule.MINISTER_CABINET,
        ],
        [NominationFile.RuleGroup.QUALITATIVE]: [],
      } as const satisfies AllRulesMap,
      testedRuleBuilderPath: `rules.${NominationFile.RuleGroup.STATUTORY}.${NominationFile.StatutoryRule.MINISTER_CABINET}`,
      ruleLabel:
        ReportVM.rulesToLabels[NominationFile.RuleGroup.STATUTORY][
          NominationFile.StatutoryRule.MINISTER_CABINET
        ],
    },
  ] as const)(
    "$testName",
    ({ ruleGroup, testRulesMap, testedRuleBuilderPath, ruleLabel }) => {
      let reportApiModelBuilder: ReportApiModelBuilder;

      beforeEach(() => {
        reportApiModelBuilder = new ReportApiModelBuilder(testRulesMap);
        store = initStore(testRulesMap);
      });

      it("hides the accordion if all its rules are out", async () => {
        const reportApiModel = reportApiModelBuilder
          .with(`${testedRuleBuilderPath}.validated`, false)
          .build();
        renderReport(reportApiModel);

        const accordion = await screen.findByText(
          getReportAccordionLabel(ruleGroup),
        );
        expect(accordion).not.toBeVisible();
      });

      it.each`
        testName                  | validated | expectChecked
        ${"checked and visible"}  | ${false}  | ${true}
        ${"unchecked and hidden"} | ${true}   | ${false}
      `("has the rule $testName", async ({ validated, expectChecked }) => {
        const reportApiModel = reportApiModelBuilder
          .with(`${testedRuleBuilderPath}.validated`, validated)
          .with(`${testedRuleBuilderPath}.preValidated`, false)
          .build();
        renderReport(reportApiModel);

        const checkboxInput =
          await screen.findByLabelText<HTMLInputElement>(ruleLabel);

        if (expectChecked) {
          expectRuleChecked(checkboxInput);
        } else {
          expectRuleUnchecked(checkboxInput);
        }
      });

      it.each`
        testName               | preValidated | expectHighlighted
        ${"highlights"}        | ${true}      | ${true}
        ${"doesn't highlight"} | ${false}     | ${false}
      `(
        "$testName rules risen by the prevalidation",
        async ({ preValidated, expectHighlighted }) => {
          const reportApiModel = reportApiModelBuilder
            .with(`${testedRuleBuilderPath}.preValidated`, preValidated)
            .build();
          renderReport(reportApiModel);

          const labelComponent = await screen.findByText(ruleLabel);

          if (expectHighlighted) {
            expect(labelComponent).toBeVisible();
          } else {
            expect(labelComponent).not.toBeVisible();
          }
          expect(labelComponent).toHaveStyle({
            color: expectHighlighted ? "var(--text-default-error)" : "",
          });
        },
      );

      it.each`
        testName      | validated | expectChecked
        ${"checks"}   | ${true}   | ${false}
        ${"unchecks"} | ${false}  | ${true}
      `("$testName the rule", async ({ validated, expectChecked }) => {
        const reportApiModel = reportApiModelBuilder
          .with(`${testedRuleBuilderPath}.validated`, validated)
          .with(`${testedRuleBuilderPath}.preValidated`, false)
          .build();
        renderReport(reportApiModel);

        await clickCheckboxAndExpectChange(ruleLabel, {
          expectedCheckedState: expectChecked,
        });
      });
    },
  );

  describe("Multiple rules in same group", () => {
    let reportApiModelBuilder: ReportApiModelBuilder;

    const anotherRuleName: NominationFile.RuleName =
      NominationFile.ManagementRule.CASSATION_COURT_NOMINATION;
    const anotherRuleLabel =
      ReportVM.rulesToLabels[NominationFile.RuleGroup.MANAGEMENT][
        anotherRuleName
      ];

    const multipleRulesMap = {
      [NominationFile.RuleGroup.MANAGEMENT]: [
        NominationFile.ManagementRule.TRANSFER_TIME,
        NominationFile.ManagementRule.CASSATION_COURT_NOMINATION,
      ],
      [NominationFile.RuleGroup.STATUTORY]: [],
      [NominationFile.RuleGroup.QUALITATIVE]: [],
    } as const satisfies AllRulesMap;

    beforeEach(() => {
      reportApiModelBuilder = new ReportApiModelBuilder(multipleRulesMap);
      store = initStore(multipleRulesMap);
    });

    it(`when checked, '${anotherRuleLabel}' can also be checked`, async () => {
      const reportApiModel = reportApiModelBuilder
        .with("rules.management.TRANSFER_TIME.validated", false)
        .with("rules.management.CASSATION_COURT_NOMINATION.validated", false)
        .build();
      reportApiClient.addReport(reportApiModel);
      renderReport(reportApiModel);

      await clickCheckboxAndExpectChange(anotherRuleLabel, {
        expectedCheckedState: true,
      });
    });
  });

  const initStore = (rulesMap?: AllRulesMap) =>
    initReduxStore(
      {
        reportGateway,
      },
      {},
      {},
      { reportFileAttached },
      undefined,
      rulesMap,
    );

  const renderReport = (report: ReportApiModel) => {
    reportApiClient.addReport(report);
    return render(
      <Provider store={store}>
        <ReportOverview id={report.id} />
      </Provider>,
    );
  };

  const clickCheckboxAndExpectChange = async (
    label: string,
    { expectedCheckedState }: { expectedCheckedState: boolean },
  ) => {
    const initialState = store.getState();
    const checkboxInput = await screen.findByLabelText<HTMLInputElement>(label);

    await userEvent.click(checkboxInput);

    // The input is 'moved' into the DOM tree, so we get the new one
    const updatedInput = await screen.findByLabelText<HTMLInputElement>(label);

    if (expectedCheckedState) {
      expectRuleChecked(updatedInput);
    } else {
      expectRuleUnchecked(updatedInput);
    }
    expect(store.getState()).not.toEqual(initialState);
  };

  const expectRuleChecked = (checkboxInput: HTMLInputElement) => {
    const label = getLabelFromCheckbox(checkboxInput);

    // We can't use toBeVisible() on react-dsfr's Checkbox input
    // because it's hidden with opacity: 0
    // doc: https://github.com/testing-library/jest-dom#tobevisible
    expect(screen.getByText(label)).toBeVisible();
    expect(checkboxInput).toBeChecked();
  };

  const expectRuleUnchecked = (checkboxInput: HTMLInputElement) => {
    const label = getLabelFromCheckbox(checkboxInput);
    expect(screen.getByText(label)).not.toBeVisible();
    expect(checkboxInput).not.toBeChecked();
  };

  const getLabelFromCheckbox = (checkboxInput: HTMLInputElement): string => {
    return checkboxInput.labels![0]!.textContent!;
  };
});
