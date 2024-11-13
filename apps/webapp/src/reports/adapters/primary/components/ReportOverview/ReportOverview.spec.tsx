import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { NominationFile } from "shared-models";
import { ReportBuilder } from "../../../../core-logic/builders/Report.builder";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { FakeReportGateway } from "../../../secondary/gateways/FakeReport.gateway";
import { ReportOverview } from "./ReportOverview";

describe("Nomination Case Overview Component", () => {
  let store: ReduxStore;
  let initialState: AppState;
  let reportGateway: FakeReportGateway;

  beforeEach(() => {
    reportGateway = new FakeReportGateway();
    store = initReduxStore(
      {
        reportGateway,
      },
      {},
      {},
    );
    initialState = store.getState();
  });

  it("shows a message if no nomination file found", async () => {
    renderReport("invalid-id");
    await screen.findByText("Dossier de nomination non trouvé.");
  });

  describe("when there is a nomination file", () => {
    beforeEach(() => {
      reportGateway.addReport(aValidatedNomination);
    });

    it("shows a message to explain autosave feature", async () => {
      renderReport(aValidatedNomination.id);
      await screen.findByText(
        "L'enregistrement des modifications est automatique.",
      );
    });

    it("shows a message to explain rules checked and red meaning", async () => {
      renderReport(aValidatedNomination.id);
      const messages = await screen.findAllByText(
        "Case cochée = la règle n'est pas respectée. Si le texte est rouge, cela signifie que notre outil de pré-analyse a détecté un risque de non-respect de la règle.",
      );
      expect(messages).toHaveLength(2);
    });

    it("shows magistrat identity section", async () => {
      renderReport(aValidatedNomination.id);
      await expectMagistratIdentity();
    });

    it("shows the observers", async () => {
      renderReport(aValidatedNomination.id);
      await screen.findByText("Observants");
      for (const [
        index,
        observer,
      ] of aValidatedNomination.observers!.entries()) {
        if (index === 0) {
          await screen.findByText(observer);
        } else {
          const observer2Name = await screen.findByText("observer 2");
          expect(observer2Name).toHaveClass("fr-text--bold");
          await screen.findByText("VPI TJ Rennes");
          await screen.findByText("(1 sur une liste de 2)");
        }
      }
    });

    it("shows the rules", async () => {
      act(() => {
        renderReport(aValidatedNomination.id);
      });

      await expectRulesFor(NominationFile.RuleGroup.MANAGEMENT);
      await expectRulesFor(NominationFile.RuleGroup.STATUTORY);
      await expectRulesFor(NominationFile.RuleGroup.QUALITATIVE);
    });

    it("show the biography with line breaks", async () => {
      renderReport(aValidatedNomination.id);
      await screen.findByText(
        /- John Doe's biography\s- second line\s- third line/,
      );
    });

    const textareaTestCases: {
      label: string;
      storeKey: string;
      placeholder?: string;
    }[] = [
      {
        label: "Commentaires généraux du rapporteur",
        storeKey: "comment",
        placeholder: ReportVM.commentPlaceholder,
      },
    ];
    describe.each(textareaTestCases)(
      "$label text section",
      ({ label, storeKey, placeholder }) => {
        let textarea: HTMLTextAreaElement | undefined;
        const newContent = "New content";

        beforeEach(() => {
          textarea = undefined;
        });

        it.skipIf(!placeholder)(
          "shows the placeholder when there is no content",
          async () => {
            const aNomination = new ReportBuilder()
              .with("id", "without-comment")
              .with("comment", null)
              .buildRetrieveVM();
            reportGateway.addReport(aNomination);

            renderReport(aNomination.id);
            textarea = await givenTheTextArea();

            expect(textarea).toHaveValue("");
            expect(textarea).toHaveAttribute(
              "placeholder",
              ReportVM.commentPlaceholder,
            );
          },
        );

        it("writes content", async () => {
          renderReport(aValidatedNomination.id);
          textarea = await givenTheTextArea();

          await typeNewBiographyText();

          expect(textarea).toHaveValue(newContent);
        });

        it("removes content", async () => {
          renderReport(aValidatedNomination.id);
          textarea = await givenTheTextArea();
          await userEvent.clear(textarea!);

          expect(textarea).toHaveValue("");
          await waitFor(() => {
            expect(store.getState()).toEqual<AppState>({
              ...initialState,
              reportOverview: {
                byIds: {
                  [aValidatedNomination.id]: {
                    ...aValidatedNomination,
                    [storeKey]: null,
                  },
                },
              },
            });
          });
        });

        it("keeps the cursor position after typing and saves the new content", async () => {
          renderReport(aValidatedNomination.id);
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
              reportOverview: {
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
        ReportVM.rulesToLabels[NominationFile.RuleGroup.MANAGEMENT][
          "TRANSFER_TIME"
        ];

      it("checks the rule", async () => {
        renderReport("report-id");
        await clickCheckboxAndExpectChange(label, { initiallyChecked: false });
      });

      it("unchecks the rule", async () => {
        reportGateway.addReport(anUnvalidatedNomination);
        renderReport("report-id");
        await clickCheckboxAndExpectChange(label, { initiallyChecked: true });
      });

      const anotherRuleName: NominationFile.RuleName =
        NominationFile.ManagementRule.GETTING_FIRST_GRADE;
      const anotherRuleLabel =
        ReportVM.rulesToLabels[NominationFile.RuleGroup.MANAGEMENT][
          anotherRuleName
        ];
      it(`when checked, '${anotherRuleLabel}' can also be checked`, async () => {
        reportGateway.addReport(
          new ReportBuilder()
            .withTransferTimeValidated(false)
            .buildRetrieveVM(),
        );
        renderReport("report-id");

        await clickCheckboxAndExpectChange(anotherRuleLabel, {
          initiallyChecked: false,
        });
      });
    });
  });

  const renderReport = (id: string) => {
    render(
      <Provider store={store}>
        <ReportOverview id={id} />
      </Provider>,
    );
  };

  const expectMagistratIdentity = async () => {
    const labels = ReportVM.magistratIdentityLabels;
    await screen.findByText("John Doe");
    await screen.findByText(`${labels.currentPosition} : PG TJ Paris`);
    await screen.findByText(`${labels.grade} : I`);
    await screen.findByText(`${labels.targettedPosition} : PG TJ Marseille`);
    await screen.findByText(`${labels.rank} : (2 sur une liste de 3)`);
    await screen.findByText(`${labels.birthDate} : 01/01/1980`);
  };

  const expectRulesFor = async (ruleGroup: NominationFile.RuleGroup) => {
    await screen.findByText(ReportVM.ruleGroupToLabel[ruleGroup]);
    await expectRulesLabelsFor(ruleGroup);
    await expectRulesUncheckedFor(ruleGroup);
  };

  const expectRulesLabelsFor = async (
    ruleGroup: NominationFile.RuleGroup,
  ): Promise<void> => {
    await waitFor(() => {
      Object.values(ReportVM.rulesToLabels[ruleGroup]).forEach((label) => {
        screen.getByText(label);
      });
    });
  };

  const expectRulesUncheckedFor = async (
    ruleGroup: NominationFile.RuleGroup,
  ): Promise<void> => {
    await waitFor(() => {
      Object.values(ReportVM.rulesToLabels[ruleGroup]).forEach((label) => {
        expectRuleUnchecked(label);
      });
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

const aValidatedNomination = new ReportBuilder()
  .with("id", "report-id")
  .with("biography", "  - John Doe's biography - second line  - third line ")
  .with("observers", [
    "observer 1",
    "observer 2\nVPI TJ Rennes\n(1 sur une liste de 2)",
  ])
  .buildRetrieveVM();

const anUnvalidatedNomination = new ReportBuilder()
  .withAllRulesUnvalidated()
  .buildRetrieveVM();
