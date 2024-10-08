import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { NominationFileOverview } from "./NominationFileOverview";
import { Provider } from "react-redux";
import { FakeNominationFileGateway } from "../../../secondary/gateways/FakeNominationFile.gateway";
import { NominationFile, RuleName } from "../../../../store/appState";
import { NominationFileBuilder } from "../../../../core-logic/builders/NominationFile.builder";
import userEvent from "@testing-library/user-event";
import { NominationFileVM } from "../../selectors/selectNominationFile";

describe("Nomination Case Overview Component", () => {
  let store: ReduxStore;
  let nominationCaseGateway: FakeNominationFileGateway;

  beforeEach(() => {
    nominationCaseGateway = new FakeNominationFileGateway();
    store = initReduxStore(
      {
        nominationCaseGateway,
      },
      {},
      {}
    );
  });

  it("shows an error message if nomination file is not found", async () => {
    renderNominationFile("invalid-id");
    await screen.findByText("Nomination case not found");
  });

  describe("when there is a nomination file", () => {
    beforeEach(() => {
      nominationCaseGateway.nominationFiles["nomination-file-id"] =
        aValidatedNomination;
    });

    it("shows its information", async () => {
      renderNominationFile("nomination-file-id");

      await screen.findByText("John Doe");
      await screen.findByText("The biography.");

      await waitFor(() => {
        Object.values(NominationFileVM.rulesToLabels).forEach((label) => {
          expectRuleUnchecked(label);
        });
      });
    });

    describe("Transfer time rule", () => {
      const label = NominationFileVM.rulesToLabels["TRANSFER_TIME"];

      it("checks the rule", async () => {
        renderNominationFile("nomination-file-id");
        await clickCheckboxAndExpectChange(label, { initiallyChecked: false });
      });

      it("unchecks the rule", async () => {
        nominationCaseGateway.nominationFiles["nomination-file-id"] =
          anUnvalidatedNomination;
        renderNominationFile("nomination-file-id");
        await clickCheckboxAndExpectChange(label, { initiallyChecked: true });
      });

      const anotherRuleName: RuleName = "GETTING_FIRST_GRADE";
      it(`when checked, '${NominationFileVM.rulesToLabels[anotherRuleName]}' can also be checked`, async () => {
        nominationCaseGateway.nominationFiles["nomination-file-id"] =
          new NominationFileBuilder().withTransferTimeValidated(false).build();
        renderNominationFile("nomination-file-id");

        await clickCheckboxAndExpectChange(
          NominationFileVM.rulesToLabels[anotherRuleName],
          {
            initiallyChecked: false,
          }
        );
      });
    });
  });

  const renderNominationFile = (id: string) => {
    render(
      <Provider store={store}>
        <NominationFileOverview id={id} />
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

const aValidatedNomination: NominationFile = new NominationFileBuilder()
  .withId("nomination-file-id")
  .withTitle("John Doe")
  .withBiography("The biography.")
  .build();

const anUnvalidatedNomination: NominationFile = new NominationFileBuilder()
  .withAllRulesUnvalidated()
  .build();
