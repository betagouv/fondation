import { render, RenderResult, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { AllRulesMap, NominationFile } from "shared-models";
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import {
  ReportApiModel,
  ReportApiModelBuilder,
} from "../../../../core-logic/builders/ReportApiModel.builder";
import { getReportAccordionLabel } from "../../../../core-logic/builders/ReportVMRules.builder";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { RulesLabelsMap } from "../../labels/rules-labels";
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

  const rulesMapWithTransferTime = {
    [NominationFile.RuleGroup.MANAGEMENT]: [
      NominationFile.ManagementRule.TRANSFER_TIME,
    ],
    [NominationFile.RuleGroup.STATUTORY]: [],
    [NominationFile.RuleGroup.QUALITATIVE]: [],
  } as const satisfies AllRulesMap;

  const rulesMapWithMinisterCabinet = {
    [NominationFile.RuleGroup.MANAGEMENT]: [],
    [NominationFile.RuleGroup.STATUTORY]: [
      NominationFile.StatutoryRule.MINISTER_CABINET,
    ],
    [NominationFile.RuleGroup.QUALITATIVE]: [],
  } as const satisfies AllRulesMap;

  const testParams = [
    {
      testName: "Management rule",
      ruleGroup: NominationFile.RuleGroup.MANAGEMENT,
      ruleName: NominationFile.ManagementRule.TRANSFER_TIME,
      testRulesMap: rulesMapWithTransferTime,
      ruleLabels: {
        label: "Label : TRANSFER_TIME",
        hint: "Hint : TRANSFER_TIME",
      },
      testedRuleBuilderPath: `rules.${NominationFile.RuleGroup.MANAGEMENT}.${NominationFile.ManagementRule.TRANSFER_TIME}`,
    },
    {
      testName: "Statutory rule",
      ruleGroup: NominationFile.RuleGroup.STATUTORY,
      ruleName: NominationFile.StatutoryRule.MINISTER_CABINET,
      testRulesMap: rulesMapWithMinisterCabinet,
      ruleLabels: {
        label: "Label : MINISTER_CABINET",
        hint: "Hint : MINISTER_CABINET",
      },
      testedRuleBuilderPath: `rules.${NominationFile.RuleGroup.STATUTORY}.${NominationFile.StatutoryRule.MINISTER_CABINET}`,
    },
  ] as const;
  describe.each(testParams)(
    "$testName",
    ({
      ruleGroup,
      ruleName,
      testRulesMap,
      testedRuleBuilderPath,
      ruleLabels,
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rulesLabelsMap: RulesLabelsMap<any> = {
        [NominationFile.RuleGroup.MANAGEMENT]:
          ruleGroup !== NominationFile.RuleGroup.MANAGEMENT
            ? {}
            : {
                [ruleName]: ruleLabels,
              },

        [NominationFile.RuleGroup.STATUTORY]:
          ruleGroup !== NominationFile.RuleGroup.STATUTORY
            ? {}
            : {
                [ruleName]: ruleLabels,
              },
        [NominationFile.RuleGroup.QUALITATIVE]: {},
      };

      let reportApiModelBuilder: ReportApiModelBuilder;

      beforeEach(() => {
        reportApiModelBuilder = new ReportApiModelBuilder(testRulesMap);
        store = initStore(testRulesMap, rulesLabelsMap);
      });

      describe("Tooltip", () => {
        let container: RenderResult;

        it("has a tooltip icon and a hidden rule hint by default", async () => {
          container = givenAReportWithOneTooltip();
          await findTooltip();
        });

        it("shows the rule hint on hover", async () => {
          container = givenAReportWithOneTooltip();

          await userEvent.hover(await findTooltip());

          // On teste la présence de cette classe car un 'aria-hidden' à 'true'
          // persiste lorsque le tooltip est visible.
          expect(await screen.findByText(ruleLabels.hint)).toHaveClass(
            "fr-tooltip--shown",
          );
        });

        const findTooltip = () =>
          container.findByRole("tooltip", { hidden: true });

        const givenAReportWithOneTooltip = () => {
          const reportApiModel = reportApiModelBuilder.build();
          return renderReport(reportApiModel);
        };
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

        const checkboxInput = await screen.findByLabelText<HTMLInputElement>(
          ruleLabels.label,
        );

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

          const labelComponent = await screen.findByText(ruleLabels.label);

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

        await clickCheckboxAndExpectChange(ruleLabels.label, {
          expectedCheckedState: expectChecked,
        });
      });
    },
  );

  describe("Multiple rules in same group", () => {
    let reportApiModelBuilder: ReportApiModelBuilder;

    const anotherRuleName =
      NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE;
    const anotherRuleLabel = "Other rule label";

    const multipleRulesMap = {
      [NominationFile.RuleGroup.MANAGEMENT]: [
        NominationFile.ManagementRule.TRANSFER_TIME,
        NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE,
      ],
      [NominationFile.RuleGroup.STATUTORY]: [],
      [NominationFile.RuleGroup.QUALITATIVE]: [],
    } as const satisfies AllRulesMap;
    const multipleRulesLabelsMap: RulesLabelsMap<typeof multipleRulesMap> = {
      [NominationFile.RuleGroup.MANAGEMENT]: {
        [NominationFile.ManagementRule.TRANSFER_TIME]: {
          label: "Label : TRANSFER_TIME",
          hint: "Hint : TRANSFER_TIME",
        },
        [anotherRuleName]: {
          label: anotherRuleLabel,
          hint: `Hint : ${anotherRuleLabel}`,
        },
      },
      [NominationFile.RuleGroup.STATUTORY]: {},
      [NominationFile.RuleGroup.QUALITATIVE]: {},
    };

    beforeEach(() => {
      reportApiModelBuilder = new ReportApiModelBuilder(multipleRulesMap);
      store = initStore(multipleRulesMap, multipleRulesLabelsMap);
    });

    it(`when checked, '${anotherRuleLabel}' can also be checked`, async () => {
      const reportApiModel = reportApiModelBuilder
        .with("rules.management.TRANSFER_TIME.validated", false)
        .with("rules.management.GETTING_GRADE_IN_PLACE.validated", false)
        .build();
      reportApiClient.addReports(reportApiModel);
      renderReport(reportApiModel);

      await clickCheckboxAndExpectChange(anotherRuleLabel, {
        expectedCheckedState: true,
      });
    });
  });

  const initStore = <T extends AllRulesMap>(
    rulesMap?: T,
    rulesLabelsMap?: RulesLabelsMap<T>,
  ) =>
    initReduxStore(
      {
        reportGateway,
      },
      {},
      {},
      {},
      undefined,
      rulesMap,
      rulesLabelsMap,
    );

  const renderReport = (report: ReportApiModel) => {
    reportApiClient.addReports(report);
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
