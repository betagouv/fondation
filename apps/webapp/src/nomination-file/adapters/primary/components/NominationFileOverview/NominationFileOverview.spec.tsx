import { NominationFile } from "@/shared-models";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { NominationFileBuilder } from "../../../../core-logic/builders/NominationFile.builder";
import { AppState, NominationFileSM } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { FakeNominationFileGateway } from "../../../secondary/gateways/FakeNominationFile.gateway";
import { NominationFileVM } from "../../selectors/selectNominationFile";
import { NominationFileOverview } from "./NominationFileOverview";

describe("Nomination Case Overview Component", () => {
  let store: ReduxStore;
  let initialState: AppState;
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
    initialState = store.getState();
  });

  it("shows an error message if nomination file is not found", async () => {
    renderNominationFile("invalid-id");
    await screen.findByText("Nomination case not found");
  });

  describe("when there is a nomination file", () => {
    beforeEach(() => {
      nominationFileGateway.addNominationFile(aValidatedNomination);
    });

    it("shows its information", async () => {
      renderNominationFile(aValidatedNomination.id);

      await expectMagistratIdentity();

      screen.getByText("Biographie");
      await screen.findByText("John Doe's biography");

      expectRulesFor(NominationFile.RuleGroup.MANAGEMENT);
      expectRulesFor(NominationFile.RuleGroup.STATUTORY);
      expectRulesFor(NominationFile.RuleGroup.QUALITATIVE);
    });

    const textareaTestCases: {
      label: string;
      storeKey: string;
      placeholder?: string;
    }[] = [
      { label: "Biographie", storeKey: "biography" },
      {
        label: "Commentaires généraux du rapporteur",
        storeKey: "comment",
        placeholder: NominationFileVM.commentPlaceholder,
      },
    ];
    describe.each(textareaTestCases)(
      "$label",
      ({ label, storeKey, placeholder }) => {
        let textarea: HTMLTextAreaElement | undefined;
        const newContent = "New content";

        beforeEach(() => {
          textarea = undefined;
        });

        it.skipIf(!placeholder)(
          "shows the placeholder when there is no content",
          async () => {
            const aNomination: NominationFileSM = new NominationFileBuilder()
              .withId("without-comment")
              .withComment(null)
              .build();
            nominationFileGateway.addNominationFile(aNomination);

            renderNominationFile(aNomination.id);
            textarea = await givenTheTextArea();

            expect(textarea).toHaveValue("");
            expect(textarea).toHaveAttribute(
              "placeholder",
              NominationFileVM.commentPlaceholder,
            );
          },
        );

        it(`updates the content`, async () => {
          renderNominationFile(aValidatedNomination.id);
          textarea = await givenTheTextArea();

          await typeNewBiographyText();

          expect(textarea).toHaveValue(newContent);
        });

        it("keeps the cursor position after typing", async () => {
          renderNominationFile(aValidatedNomination.id);
          textarea = await givenTheTextArea();
          await typeNewBiographyText();
          moveToCursorPosition(3);
          await userEvent.keyboard(":");
          const newContentAfterCursorTyping =
            newContent.slice(0, 3) + ":" + newContent.slice(3);

          expectCursorPosition(4);
          expect(textarea).toHaveValue(newContentAfterCursorTyping);
          await waitFor(() => {
            expect(store.getState()).toEqual<AppState>({
              ...initialState,
              nominationFileOverview: {
                byIds: {
                  [aValidatedNomination.id]: {
                    ...aValidatedNomination,
                    [storeKey]: newContentAfterCursorTyping,
                  },
                },
              },
            });
          });
          expectCursorPosition(4);
        });

        const typeNewBiographyText = async () => {
          await userEvent.clear(textarea!);
          await userEvent.type(textarea!, newContent);
        };

        const givenTheTextArea = async () =>
          (await screen.findByLabelText(label)) as HTMLTextAreaElement;

        const moveToCursorPosition = (position: number) => {
          textarea!.focus();
          textarea!.setSelectionRange(position, position);
        };

        const expectCursorPosition = (position: number) => {
          expect(textarea!.selectionStart).toBe(position);
          expect(textarea!.selectionEnd).toBe(position);
        };
      },
    );

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

  const expectRulesFor = async (ruleGroup: NominationFile.RuleGroup) => {
    screen.getByText(NominationFileVM.ruleGroupToLabel[ruleGroup]);
    await expectRulesLabelsFor(ruleGroup);
    await expectRulesUncheckedFor(ruleGroup);
  };

  const expectRulesLabelsFor = async (
    ruleGroup: NominationFile.RuleGroup,
  ): Promise<void> => {
    await waitFor(() => {
      Object.values(NominationFileVM.rulesToLabels[ruleGroup]).forEach(
        (label) => {
          screen.getByText(label);
        },
      );
    });
  };

  const expectRulesUncheckedFor = async (
    ruleGroup: NominationFile.RuleGroup,
  ): Promise<void> => {
    await waitFor(() => {
      Object.values(NominationFileVM.rulesToLabels[ruleGroup]).forEach(
        (label) => {
          expectRuleUnchecked(label);
        },
      );
    });
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
