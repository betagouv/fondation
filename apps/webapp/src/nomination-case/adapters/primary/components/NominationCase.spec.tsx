import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationCaseOverview } from "./NominationCase";
import { Provider } from "react-redux";
import { FakeNominationCaseGateway } from "../../secondary/gateways/FakeNominationCase.gateway";
import { NominationCase, RuleName } from "../../../store/appState";
import { NominationCaseBuilder } from "../../../core-logic/builders/nominationCase.builder";
import userEvent from "@testing-library/user-event";
import { NominationCaseVM } from "../presenters/selectNominationCase";

describe("Nomination Case Component", () => {
  let store: ReduxStore;
  let nominationCaseGateway: FakeNominationCaseGateway;

  beforeEach(() => {
    nominationCaseGateway = new FakeNominationCaseGateway();
    store = initReduxStore({
      nominationCaseGateway,
    });
  });

  it("shows an error message if nomination case is not found", async () => {
    renderNominationCase("invalid-id");
    await screen.findByText("Nomination case not found");
  });

  describe("when there is a nomination case", () => {
    beforeEach(() => {
      nominationCaseGateway.nominationCases["nomination-case-id"] =
        aValidatedNomination;
    });

    it("shows its information", async () => {
      renderNominationCase("nomination-case-id");

      await screen.findByText("John Doe");
      await screen.findByText("The biography.");
      await waitFor(() => {
        expectRuleUnchecked(NominationCaseVM.rulesToLabels["transferTime"]);
        expectRuleUnchecked(
          NominationCaseVM.rulesToLabels["gettingFirstGrade"]
        );
        expectRuleUnchecked(NominationCaseVM.rulesToLabels["gettingGradeHH"]);
        expectRuleUnchecked(
          NominationCaseVM.rulesToLabels["gettingGradeInPlace"]
        );
        expectRuleUnchecked(NominationCaseVM.rulesToLabels["profiledPosition"]);
        expectRuleUnchecked(
          NominationCaseVM.rulesToLabels["cassationCourtNomination"]
        );
        expectRuleUnchecked(
          NominationCaseVM.rulesToLabels["overseasToOverseas"]
        );
        expectRuleUnchecked(
          NominationCaseVM.rulesToLabels[
            "judiciaryRoleAndJuridictionDegreeChange"
          ]
        );
        expectRuleUnchecked(
          NominationCaseVM.rulesToLabels[
            "judiciaryRoleAndJuridictionDegreeChangeInSameRessort"
          ]
        );
      });
    });

    describe("Transfer time rule", () => {
      const label = NominationCaseVM.rulesToLabels["transferTime"];
      const ruleName = "transferTime";

      it("checks the rule", async () => {
        renderNominationCase("nomination-case-id");

        await userEvent.click(
          await screen.findByRole("checkbox", {
            name: label,
            checked: false,
          })
        );
        await screen.findByRole("checkbox", {
          name: label,
          checked: true,
        });
      });

      it("unchecks the rule", async () => {
        nominationCaseGateway.nominationCases["nomination-case-id"] =
          anUnvalidatedNomination;
        renderNominationCase("nomination-case-id");

        await userEvent.click(
          await screen.findByRole("checkbox", {
            name: label,
            checked: true,
          })
        );
        await screen.findByRole("checkbox", {
          name: label,
          checked: true,
        });
      });

      const rulesScenarionWithOnlyOneUnValidatedRule: [
        string,
        string,
        NominationCase,
      ][] = genRulesExcept(ruleName).map((rule) => [
        ruleName,
        rule[1],
        new NominationCaseBuilder().withTransferTimeValidated(false).build(),
      ]);
      it.only.each(rulesScenarionWithOnlyOneUnValidatedRule)(
        "when %s rule is checked, %s can be checked",
        async (_, label, nominationCase) => {
          nominationCaseGateway.nominationCases["nomination-case-id"] =
            nominationCase;
          renderNominationCase("nomination-case-id");

          await userEvent.click(
            await screen.findByRole("checkbox", {
              name: label,
              checked: false,
            })
          );
          await screen.findByRole("checkbox", {
            name: label,
            checked: true,
          });
        }
      );
    });
  });

  const renderNominationCase = (id: string) => {
    render(
      <Provider store={store}>
        <NominationCaseOverview id={id} />
      </Provider>
    );
  };

  const expectRuleUnchecked = (name: string) => {
    expect(screen.queryByRole("checkbox", { name })).not.toBeChecked();
  };

  const genRulesExcept = (ruleName: RuleName) =>
    Object.entries(NominationCaseVM.rulesToLabels).filter(
      ([name]) => name !== ruleName
    );
});

const aValidatedNomination: NominationCase = new NominationCaseBuilder()
  .withId("nomination-case-id")
  .withName("John Doe")
  .withBiography("The biography.")
  .build();

const anUnvalidatedNomination: NominationCase = new NominationCaseBuilder()
  .withAllRulesUnvalidated()
  .build();
