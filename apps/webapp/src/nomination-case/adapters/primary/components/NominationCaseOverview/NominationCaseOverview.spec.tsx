import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { NominationCaseOverview } from "./NominationCaseOverview";
import { Provider } from "react-redux";
import { FakeNominationCaseGateway } from "../../../secondary/gateways/FakeNominationCase.gateway";
import { NominationCase, RuleName } from "../../../../store/appState";
import { NominationCaseBuilder } from "../../../../core-logic/builders/nominationCase.builder";
import userEvent from "@testing-library/user-event";
import { NominationCaseVM } from "../../presenters/selectNominationCase";

describe("Nomination Case Overview Component", () => {
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
        Object.values(NominationCaseVM.rulesToLabels).forEach((label) => {
          expectRuleUnchecked(label);
        });
      });
    });

    describe("Transfer time rule", () => {
      const label = NominationCaseVM.rulesToLabels["transferTime"];

      it("checks the rule", async () => {
        renderNominationCase("nomination-case-id");
        await clickCheckboxAndExpectChange(label, { initiallyChecked: false });
      });

      it("unchecks the rule", async () => {
        nominationCaseGateway.nominationCases["nomination-case-id"] =
          anUnvalidatedNomination;
        renderNominationCase("nomination-case-id");
        await clickCheckboxAndExpectChange(label, { initiallyChecked: true });
      });

      const anotherRuleName: RuleName = "gettingFirstGrade";
      it(`when checked, '${NominationCaseVM.rulesToLabels[anotherRuleName]}' can also be checked`, async () => {
        nominationCaseGateway.nominationCases["nomination-case-id"] =
          new NominationCaseBuilder().withTransferTimeValidated(false).build();
        renderNominationCase("nomination-case-id");

        await clickCheckboxAndExpectChange(
          NominationCaseVM.rulesToLabels[anotherRuleName],
          {
            initiallyChecked: false,
          }
        );
      });
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

  const clickCheckboxAndExpectChange = async (
    label: string,
    { initiallyChecked }: { initiallyChecked: boolean }
  ) => {
    const initialState = store.getState();

    await userEvent.click(
      await screen.findByRole("checkbox", {
        name: label,
        checked: initiallyChecked,
      })
    );

    await waitFor(async () => {
      expect(store.getState()).not.toEqual(initialState);
      await screen.findByRole("checkbox", {
        name: label,
        checked: !initiallyChecked,
      });
    });
  };
});

const aValidatedNomination: NominationCase = new NominationCaseBuilder()
  .withId("nomination-case-id")
  .withName("John Doe")
  .withBiography("The biography.")
  .build();

const anUnvalidatedNomination: NominationCase = new NominationCaseBuilder()
  .withAllRulesUnvalidated()
  .build();
