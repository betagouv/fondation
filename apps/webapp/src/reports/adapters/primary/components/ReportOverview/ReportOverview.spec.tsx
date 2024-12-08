import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { AllRulesMap, NominationFile } from "shared-models";
import sharp from "sharp";
import { ReportBuilder } from "../../../../core-logic/builders/Report.builder";
import { ReportApiModelBuilder } from "../../../../core-logic/builders/ReportApiModel.builder";
import { reportFileAttached } from "../../../../core-logic/listeners/report-file-attached.listeners";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { AppState } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { ReportOverview } from "./ReportOverview";

const testRulesMap = {
  [NominationFile.RuleGroup.MANAGEMENT]: [
    NominationFile.ManagementRule.TRANSFER_TIME,
    NominationFile.ManagementRule.CASSATION_COURT_NOMINATION,
  ],
  [NominationFile.RuleGroup.STATUTORY]: [],
  [NominationFile.RuleGroup.QUALITATIVE]: [],
} as const satisfies AllRulesMap;

describe("Report Overview Component", () => {
  let store: ReduxStore;
  let initialState: AppState;
  let reportApiClient: FakeReportApiClient;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);
    store = initReduxStore(
      {
        reportGateway,
      },
      {},
      {},
      { reportFileAttached },
      undefined,
      testRulesMap,
    );
    initialState = store.getState();
  });

  it("shows a message if no report found", async () => {
    renderReport("invalid-id");
    await screen.findByText("Dossier de nomination non trouvé.");
  });

  describe("when there is a report", () => {
    it("shows a message to explain autosave feature", async () => {
      givenAValidatedReport();
      renderReport(aValidatedReport.id);
      await screen.findByText(
        "L'enregistrement des modifications est automatique.",
      );
    });

    it("shows magistrat identity section", async () => {
      givenAValidatedReport();
      renderReport(aValidatedReport.id);

      await expectMagistratIdentity();
    });

    it("shows the observers", async () => {
      givenAValidatedReport();
      renderReport(aValidatedReport.id);

      await screen.findByText("Observants");

      for (const [index, observer] of aValidatedReport.observers!.entries()) {
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

    it("show the biography with line breaks", async () => {
      givenAValidatedReport();
      renderReport(aValidatedReport.id);

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
        label: ReportVM.commentLabel,
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
            const aReport = new ReportApiModelBuilder()
              .with("id", "without-comment")
              .with("comment", null)
              .withSomeRules()
              .build();
            reportApiClient.addReport(aReport);

            renderReport(aReport.id);
            textarea = await givenTheTextArea();

            expect(textarea).toHaveValue("");
            expect(textarea).toHaveAttribute(
              "placeholder",
              ReportVM.commentPlaceholder,
            );
          },
        );

        it("writes content", async () => {
          givenAValidatedReport();
          renderReport(aValidatedReport.id);

          textarea = await givenTheTextArea();

          await typeNewBiographyText();

          expect(textarea).toHaveValue(newContent);
        });

        it("removes content", async () => {
          givenAValidatedReport();
          renderReport(aValidatedReport.id);

          textarea = await givenTheTextArea();
          await userEvent.clear(textarea!);

          expect(textarea).toHaveValue("");
          await waitFor(() => {
            expect(store.getState()).toEqual<AppState>({
              ...initialState,
              reportOverview: {
                ...initialState.reportOverview,
                byIds: {
                  [aValidatedReport.id]: {
                    ...aValidatedReport,
                    [storeKey]: null,
                  },
                },
              },
            });
          });
        });

        it("keeps the cursor position after typing and saves the new content", async () => {
          givenAValidatedReport();
          renderReport(aValidatedReport.id);

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
                ...initialState.reportOverview,
                byIds: {
                  [aValidatedReport.id]: {
                    ...aValidatedReport,
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

    describe("Files", () => {
      it("uploads a file", async () => {
        givenAValidatedReport();
        renderReport(aValidatedReport.id);

        const fileBuffer = await givenAPngBuffer();

        const file = new File([fileBuffer], "image.png", {
          type: "image/png",
        });

        await screen.findByText(aValidatedReport.name);
        const input = await screen.findByLabelText(
          /^Ajouter des pièces jointes/,
        );
        await userEvent.upload(input, file);

        expect(store.getState().reportOverview.byIds).toEqual({
          [aValidatedReport.id]: {
            ...aValidatedReport,
            attachedFiles: [
              {
                name: "image.png",
                signedUrl: `${FakeReportApiClient.BASE_URI}/image.png`,
              },
            ],
          },
        });
      });

      it("lists attached files urls", async () => {
        reportApiClient.addReport({
          ...aValidatedReportApiModel,
          attachedFiles: [
            {
              name: "file1.png",
              signedUrl: `${FakeReportApiClient.BASE_URI}/file1.png`,
            },
            {
              name: "file2.png",
              signedUrl: `${FakeReportApiClient.BASE_URI}/file2.png`,
            },
          ],
        });
        renderReport(aValidatedReport.id);

        await screen.findByText("file1.png");
        await screen.findByText("file2.png");
      });

      it("deletes an attached file", async () => {
        reportApiClient.addReport({
          ...aValidatedReportApiModel,
          attachedFiles: [
            {
              name: "file1.png",
              signedUrl: `${FakeReportApiClient.BASE_URI}/file1.png`,
            },
            {
              name: "file2.png",
              signedUrl: `${FakeReportApiClient.BASE_URI}/file2.png`,
            },
          ],
        });
        renderReport(aValidatedReport.id);

        await screen.findByText("file1.png");

        const deleteButton = await screen.findByRole("button", {
          name: "delete-attached-file-file1.png",
        });
        await userEvent.click(deleteButton);
        expect(screen.queryByText("file1.png")).toBeNull();
      });
    });

    const givenAPngBuffer = () =>
      sharp({
        create: {
          width: 256,
          height: 256,
          channels: 3,
          background: { r: 128, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();

    const givenAValidatedReport = () => {
      reportApiClient.addReport(aValidatedReportApiModel);
    };
  });

  const renderReport = (id: string) => {
    return render(
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
});

const aValidatedReportApiModel = new ReportApiModelBuilder()
  .with("id", "report-id")
  .with("biography", "  - John Doe's biography - second line  - third line ")
  .with("observers", [
    "observer 1",
    "observer 2\nVPI TJ Rennes\n(1 sur une liste de 2)",
  ])
  .withSomeRules()
  .with("rules.management.TRANSFER_TIME.validated", true)
  .build();
const aValidatedReport = ReportBuilder.fromApiModel(
  aValidatedReportApiModel,
).buildRetrieveSM();
