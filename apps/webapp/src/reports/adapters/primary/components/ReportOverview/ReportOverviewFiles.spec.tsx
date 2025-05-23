import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { ReportFileUsage } from "shared-models";
import sharp from "sharp";
import { StubRouterProvider } from "../../../../../router/adapters/stubRouterProvider";
import { RealFileProvider } from "../../../../../shared-kernel/adapters/secondary/providers/realFileProvider";
import { AppState, ReportSM } from "../../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import {
  ExpectStoredReports,
  expectStoredReportsFactory,
} from "../../../../../test/reports";
import { ReportBuilder } from "../../../../core-logic/builders/Report.builder";
import {
  ReportApiModel,
  ReportApiModelBuilder,
} from "../../../../core-logic/builders/ReportApiModel.builder";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { ReportOverview } from "./ReportOverview";
import { reportFilesAttached } from "../../../../core-logic/listeners/report-files-attached.listeners";
import { DeterministicUuidGenerator } from "../../../../../shared-kernel/adapters/secondary/providers/deterministicUuidGenerator";
import { ApiFileGateway } from "../../../../../files/adapters/secondary/gateways/ApiFile.gateway";
import { FakeFileApiClient } from "../../../../../files/adapters/secondary/gateways/FakeFile.client";

describe("Report Overview Component - Files", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let reportApiClient: FakeReportApiClient;
  let fileApiClient: FakeFileApiClient;
  let reportApiModelBuilder: ReportApiModelBuilder;
  let expectStoredReports: ExpectStoredReports;
  let routerProvider: StubRouterProvider;
  let uuidGenerator: DeterministicUuidGenerator;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);
    fileApiClient = new FakeFileApiClient();
    const fileGateway = new ApiFileGateway(fileApiClient);
    routerProvider = new StubRouterProvider();
    const fileProvider = new RealFileProvider();
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [fileId1, fileId2];

    store = initReduxStore(
      {
        reportGateway,
        fileGateway,
      },
      { routerProvider, fileProvider, uuidGenerator },
      {},
      { reportFilesAttached },
    );
    initialState = store.getState();

    reportApiModelBuilder = new ReportApiModelBuilder();
    expectStoredReports = expectStoredReportsFactory(store, initialState);
  });

  const uploadTestParams: {
    testName: string;
    fileNames: string[];
    expectedAttachedFiles: ReportSM["attachedFiles"];
  }[] = [
    {
      testName: "uploads a file",
      fileNames: ["image.png"],
      expectedAttachedFiles: [
        {
          name: "image.png",
          fileId: fileId1,
          signedUrl: `${FakeReportApiClient.BASE_URI}/image.png`,
        },
      ],
    },
    {
      testName: "uploads two files",
      fileNames: ["image.png", "image2.png"],
      expectedAttachedFiles: [
        {
          name: "image.png",
          fileId: fileId1,
          signedUrl: `${FakeReportApiClient.BASE_URI}/image.png`,
        },
        {
          name: "image2.png",
          fileId: fileId2,
          signedUrl: `${FakeReportApiClient.BASE_URI}/image2.png`,
        },
      ],
    },
  ];
  it.each(uploadTestParams)(
    "$testName",
    async ({ fileNames, expectedAttachedFiles }) => {
      fileApiClient.setFiles(
        {
          fileId: fileId1,
          name: "image.png",
          signedUrl: `${FakeReportApiClient.BASE_URI}/image.png`,
        },
        {
          fileId: fileId2,
          name: "image2.png",
          signedUrl: `${FakeReportApiClient.BASE_URI}/image2.png`,
        },
      );
      const reportApiModel = reportApiModelBuilder.build();
      await givenARenderedReport(reportApiModel);

      const aReportVM =
        ReportBuilder.fromApiModel(reportApiModel).buildRetrieveSM();
      const fileBuffer = await givenAPngBuffer();
      const files = fileNames.map(
        (fileName) =>
          new File([fileBuffer], fileName, {
            type: "image/png",
          }),
      );

      const input = await screen.findByLabelText(/^Formats supportés.*/);
      await userEvent.upload(input, files);

      await waitFor(() => {
        expectStoredReports({
          ...aReportVM,
          attachedFiles: expectedAttachedFiles,
        });
      });
    },
  );

  it("lists attached files urls", async () => {
    const reportApiModel = reportApiModelBuilder
      .with("attachedFiles", [
        {
          usage: ReportFileUsage.ATTACHMENT,
          name: "file1.png",
          fileId: "file-id1",
          signedUrl: `${FakeReportApiClient.BASE_URI}/file1.png`,
        },
        {
          usage: ReportFileUsage.ATTACHMENT,
          name: "file2.png",
          fileId: "file-id2",
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
          usage: ReportFileUsage.ATTACHMENT,
          name: "file1.png",
          fileId: "file-id1",
          signedUrl: `${FakeReportApiClient.BASE_URI}/file1.png`,
        },
        {
          usage: ReportFileUsage.ATTACHMENT,
          name: "file2.png",
          fileId: "file-id2",
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

const fileId1 = "file-id1";
const fileId2 = "file-id2";
