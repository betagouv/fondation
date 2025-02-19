import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { AllRulesMap, NominationFile } from "shared-models";
import sharp from "sharp";
import { AppState } from "../../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import {
  ExpectReports,
  expectReportsFactory,
} from "../../../../../test/reports";
import { ReportBuilder } from "../../../../core-logic/builders/Report.builder";
import {
  ReportApiModel,
  ReportApiModelBuilder,
} from "../../../../core-logic/builders/ReportApiModel.builder";
import { reportFileAttached } from "../../../../core-logic/listeners/report-file-attached.listeners";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { RulesLabelsMap } from "../../labels/rules-labels";
import { ReportOverview } from "./ReportOverview";

const testRulesMap = {
  [NominationFile.RuleGroup.MANAGEMENT]: [
    NominationFile.ManagementRule.TRANSFER_TIME,
    NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE,
  ],
  [NominationFile.RuleGroup.STATUTORY]: [],
  [NominationFile.RuleGroup.QUALITATIVE]: [],
} as const satisfies AllRulesMap;

const testRulesLabelsMap: RulesLabelsMap<typeof testRulesMap> = {
  [NominationFile.RuleGroup.MANAGEMENT]: {
    [NominationFile.ManagementRule.TRANSFER_TIME]: {
      label: "TRANSFER_TIME label",
      hint: "TRANSFER_TIME hint",
    },
    [NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE]: {
      label: "GETTING_GRADE_IN_PLACE label",
      hint: "GETTING_GRADE_IN_PLACE hint",
    },
  },
  [NominationFile.RuleGroup.STATUTORY]: {},
  [NominationFile.RuleGroup.QUALITATIVE]: {},
};

describe("Report Overview Component", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let reportApiModelBuilder: ReportApiModelBuilder;
  let expectReports: ExpectReports;

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
      testRulesLabelsMap,
    );
    initialState = store.getState();

    reportApiModelBuilder = new ReportApiModelBuilder(testRulesMap);
    expectReports = expectReportsFactory(store, initialState);
  });

  it("shows a message if no report found", async () => {
    renderReportId("invalid-id");
    await screen.findByText("Rapport non trouvé.");
  });

  describe("when there is a report", () => {
    it("shows a message to explain autosave feature", async () => {
      const report = reportApiModelBuilder.build();
      await givenARenderedReport(report);
      await screen.findByText(
        "L'enregistrement des modifications est automatique.",
      );
    });

    it("changes the report state from 'in progress' to 'ready to support'", async () => {
      const reportApiModel = reportApiModelBuilder
        .with("state", NominationFile.ReportState.IN_PROGRESS)
        .build();
      const expectedReportVM = ReportBuilder.fromApiModel(reportApiModel)
        .with("state", NominationFile.ReportState.READY_TO_SUPPORT)
        .buildRetrieveSM();
      await givenARenderedReport(reportApiModel);

      const select = await screen.findByLabelText(ReportVM.stateSelectLabel);
      await userEvent.selectOptions(
        select,
        ReportVM.stateSelectOptions[
          NominationFile.ReportState.READY_TO_SUPPORT
        ],
      );

      await waitFor(() => {
        expectReports(expectedReportVM);
      });
    });

    it("shows the observers", async () => {
      const reportApiModel = reportApiModelBuilder
        .with("observers", [
          "observer 1",
          "observer 2\nVPI TJ Rennes\n(1 sur une liste de 2)",
        ])
        .build();
      const aReportVM =
        ReportBuilder.fromApiModel(reportApiModel).buildRetrieveSM();
      await givenARenderedReport(reportApiModel);

      await screen.findByText("Observants", {
        selector: "h2",
      });

      for (const [index, observer] of aReportVM.observers!.entries()) {
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
      const reportApiModel = reportApiModelBuilder
        .with(
          "biography",
          "  - John Doe's biography - second line  - third line ",
        )
        .build();
      await givenARenderedReport(reportApiModel);

      await screen.findByText(
        /- John Doe's biography\s- second line\s- third line/,
      );
    });

    describe("Files", () => {
      it("uploads a file", async () => {
        const reportApiModel = reportApiModelBuilder.build();
        await givenARenderedReport(reportApiModel);

        const aReportVM =
          ReportBuilder.fromApiModel(reportApiModel).buildRetrieveSM();
        const fileBuffer = await givenAPngBuffer();

        const file = new File([fileBuffer], "image.png", {
          type: "image/png",
        });

        await screen.findByText(aReportVM.name);
        const input = await screen.findByLabelText(/^Formats supportés.*/);
        await userEvent.upload(input, file);

        expectReports({
          ...aReportVM,
          attachedFiles: [
            {
              name: "image.png",
              signedUrl: `${FakeReportApiClient.BASE_URI}/image.png`,
            },
          ],
        });
      });

      it("lists attached files urls", async () => {
        const reportApiModel = reportApiModelBuilder
          .with("attachedFiles", [
            {
              name: "file1.png",
              signedUrl: `${FakeReportApiClient.BASE_URI}/file1.png`,
            },
            {
              name: "file2.png",
              signedUrl: `${FakeReportApiClient.BASE_URI}/file2.png`,
            },
          ])
          .build();
        await givenARenderedReport(reportApiModel);

        await screen.findByText("file1.png");
        await screen.findByText("file2.png");
      });

      it("deletes an attached file", async () => {
        const reportApiModel = reportApiModelBuilder
          .with("attachedFiles", [
            {
              name: "file1.png",
              signedUrl: `${FakeReportApiClient.BASE_URI}/file1.png`,
            },
            {
              name: "file2.png",
              signedUrl: `${FakeReportApiClient.BASE_URI}/file2.png`,
            },
          ])
          .build();
        await givenARenderedReport(reportApiModel);

        await screen.findByText("file1.png");
        const deleteButton = screen.getByRole("button", {
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
  });

  const givenARenderedReport = async (report: ReportApiModel) => {
    act(() => {
      reportApiClient.reports = {};
      reportApiClient.addReports(report);
    });

    // Hack car React Testing Library se plaint parfois qu'un update du state n'est pas wrappé dans un act.
    // L'utilisation de 'act' ne suffisant pas, on vérifie que le composant est prêt
    // en vérifiant le texte de la notice.
    const rendered = renderReportId(report.id);
    await screen.findByText(
      "L'enregistrement des modifications est automatique.",
    );
    return rendered;
  };

  const renderReportId = (reportId: string) => {
    return render(
      <Provider store={store}>
        <ReportOverview id={reportId} />
      </Provider>,
    );
  };
});
