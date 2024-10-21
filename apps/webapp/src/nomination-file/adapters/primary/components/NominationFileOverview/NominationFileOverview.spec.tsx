import { NominationFile } from "@/shared-models";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { NominationFileBuilder } from "../../../../core-logic/builders/NominationFile.builder";
import { NominationFileSM } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { FakeNominationFileGateway } from "../../../secondary/gateways/FakeNominationFile.gateway";
import { NominationFileVM } from "../../selectors/selectNominationFile";
import { NominationFileOverview } from "./NominationFileOverview";

describe("Nomination Case Overview Component", () => {
  let store: ReduxStore;
  let nominationFileGateway: FakeNominationFileGateway;

  beforeEach(() => {
    nominationFileGateway = new FakeNominationFileGateway();
    store = initReduxStore(
      {
        nominationFileGateway,
      },
      {},
      {},
    );
  });

  it("shows an error message if nomination file is not found", async () => {
    renderNominationFile("invalid-id");
    await screen.findByText("Nomination case not found");
  });

  describe("when there is a nomination file", () => {
    beforeEach(() => {
      nominationFileGateway.addNominationFile(aValidatedNomination);
    });

    it.only("shows its information", async () => {
      renderNominationFile("nomination-file-id");

      await expectMagistratIdentity();

      await screen.findByText("Biographie");
      await screen.findByText("John Doe's biography");
      // await screen.findByText("30/10/2030");
      // await screen.findByText("NEW");
      // await screen.findByText("Some comment");

      screen.getByText("Règles de gestion");
      await screen.findByRole("checkbox", {
        name: NominationFileVM.rulesToLabels.management.TRANSFER_TIME,
      });
      await waitFor(() => {
        Object.values(NominationFileVM.rulesToLabels.management).forEach(
          (label) => {
            expectRuleUnchecked(label);
          },
        );
      });

      screen.getByText("Règles statutaires");
      await waitFor(() => {
        Object.values(NominationFileVM.rulesToLabels.statutory).forEach(
          (label) => {
            expectRuleUnchecked(label);
          },
        );
      });

      screen.getByText("Les autres éléments qualitatifs à vérifier");
      await waitFor(() => {
        Object.values(NominationFileVM.rulesToLabels.qualitative).forEach(
          (label) => {
            expectRuleUnchecked(label);
          },
        );
      });
    });

    describe("Transfer time rule", () => {
      const label =
        NominationFileVM.rulesToLabels[NominationFile.RuleGroup.MANAGEMENT][
          "TRANSFER_TIME"
        ];

      it("checks the rule", async () => {
        renderNominationFile("nomination-file-id");
        await clickCheckboxAndExpectChange(label, { initiallyChecked: false });
      });

      it("unchecks the rule", async () => {
        nominationFileGateway.addNominationFile(anUnvalidatedNomination);
        renderNominationFile("nomination-file-id");
        await clickCheckboxAndExpectChange(label, { initiallyChecked: true });
      });

      const anotherRuleName: NominationFile.RuleName =
        NominationFile.ManagementRule.GETTING_FIRST_GRADE;
      const anotherRuleLabel =
        NominationFileVM.rulesToLabels[NominationFile.RuleGroup.MANAGEMENT][
          anotherRuleName
        ];
      it(`when checked, '${anotherRuleLabel}' can also be checked`, async () => {
        nominationFileGateway.addNominationFile(
          new NominationFileBuilder().withTransferTimeValidated(false).build(),
        );
        renderNominationFile("nomination-file-id");

        await clickCheckboxAndExpectChange(anotherRuleLabel, {
          initiallyChecked: false,
        });
      });
    });
  });

  const renderNominationFile = (id: string) => {
    render(
      <Provider store={store}>
        <NominationFileOverview id={id} />
      </Provider>,
    );
  };

  const expectMagistratIdentity = async () => {
    const labels = NominationFileVM.magistratIdentityLabels;
    await screen.findByText("John Doe");
    await screen.findByText(`${labels.currentPosition} : PG TJ Paris`);
    await screen.findByText(`${labels.grade} : I`);
    await screen.findByText(`${labels.targettedPosition} : PG TJ Marseille`);
    await screen.findByText(`${labels.rank} : (2 sur une liste de 3)`);
    await screen.findByText(`${labels.birthDate} : 01/01/1980`);
  };

  const expectRuleUnchecked = (name: string) => {
    expect(screen.queryByRole("checkbox", { name })).not.toBeChecked();
  };

  const clickCheckboxAndExpectChange = async (
    label: string,
    { initiallyChecked }: { initiallyChecked: boolean },
  ) => {
    const initialState = store.getState();

    await userEvent.click(
      await screen.findByRole("checkbox", {
        name: label,
        checked: initiallyChecked,
      }),
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

const aValidatedNomination: NominationFileSM = new NominationFileBuilder()
  .withId("nomination-file-id")
  .build();

const anUnvalidatedNomination: NominationFileSM = new NominationFileBuilder()
  .withAllRulesUnvalidated()
  .build();
