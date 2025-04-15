import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import _ from "lodash";
import { Provider } from "react-redux";
import {
  AuthenticatedUser,
  Magistrat,
  NominationFile,
  Transparency,
} from "shared-models";
import { ApiAuthenticationGateway } from "../../../../../authentication/adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../../../../authentication/adapters/secondary/gateways/FakeAuthentication.client";
import {
  authenticate,
  AuthenticateParams,
} from "../../../../../authentication/core-logic/use-cases/authentication/authenticate";
import { ApiFileGateway } from "../../../../../files/adapters/secondary/gateways/ApiFile.gateway";
import { FakeFileApiClient } from "../../../../../files/adapters/secondary/gateways/FakeFile.client";
import { StubRouterProvider } from "../../../../../router/adapters/stubRouterProvider";
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import {
  ExpectTransparenciesBreadcrumb,
  expectTransparenciesBreadcrumbFactory,
} from "../../../../../test/breadcrumb";
import { ReportApiModelBuilder } from "../../../../core-logic/builders/ReportApiModel.builder";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { ApiTransparencyGateway } from "../../../secondary/gateways/ApiTransparency.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { FakeTransparencyApiClient } from "../../../secondary/gateways/FakeTransparency.client";
import { reportListTableLabels } from "../../labels/report-list-table-labels";
import { ReportList } from "./ReportList";
import { Role } from "shared-models";

describe("Report List Component", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;
  let reportApiClient: FakeReportApiClient;
  let authenticationApiClient: FakeAuthenticationApiClient;
  let transparencyApiClient: FakeTransparencyApiClient;
  let fileApiClient: FakeFileApiClient;
  let expectTransparenciesBreadcrumb: ExpectTransparenciesBreadcrumb;

  beforeEach(() => {
    authenticationApiClient = new FakeAuthenticationApiClient();
    authenticationApiClient.setEligibleAuthUser(
      userCredentials.email,
      userCredentials.password,
      user.firstName,
      user.lastName,
      user.role,
    );
    const authenticationGateway = new ApiAuthenticationGateway(
      authenticationApiClient,
    );

    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);

    transparencyApiClient = new FakeTransparencyApiClient();
    const transparencyGateway = new ApiTransparencyGateway(
      transparencyApiClient,
    );

    fileApiClient = new FakeFileApiClient();
    const fileGateway = new ApiFileGateway(fileApiClient);

    routerProvider = new StubRouterProvider();
    routerProvider.onReportOverviewClick = vi.fn();

    store = initReduxStore(
      {
        reportGateway,
        authenticationGateway,
        transparencyGateway,
        fileGateway,
      },
      { routerProvider },
      {},
      {},
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      [
        Transparency.AUTOMNE_2024,
        Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024,
      ],
    );

    expectTransparenciesBreadcrumb =
      expectTransparenciesBreadcrumbFactory(routerProvider);
  });

  it("shows an empty list message", async () => {
    renderReportList();
    await screen.findByText("Aucun rapport.");
  });

  it("doesn't show the new reports count", async () => {
    renderReportList();
    await expect(screen.findByText(/nouveau(x)? rapport/i)).rejects.toThrow();
  });

  describe.each`
    count                  | newReportsCount
    ${"one new report"}    | ${1}
    ${"three new reports"} | ${3}
  `(
    "when there is $description",
    ({ newReportsCount }: { newReportsCount: number }) => {
      beforeEach(() => {
        givenAnAuthenticatedUser();
        reportApiClient.addReports(
          ..._.range(newReportsCount).map((count) =>
            new ReportApiModelBuilder()
              .with("id", `report-id-${count}`)
              .with("state", NominationFile.ReportState.NEW)
              .build(),
          ),
        );
      });

      it("shows the new reports count", async () => {
        renderReportList();

        await screen.findByText("Vous avez ", { exact: false });
        await screen.findByText(
          newReportsCount > 1
            ? `${newReportsCount} nouveaux rapports`
            : "1 nouveau rapport",
        );
        await screen.findByText("sur cette transparence.", { exact: false });
      });
    },
  );

  describe("Breadcrumb", () => {
    it("shows the current page", async () => {
      renderReportList();
      within(await screen.findByRole("navigation")).getByText("Rapports");
    });

    it("redirects to the transparency page", async () => {
      renderReportList();
      await expectTransparenciesBreadcrumb();
    });
  });

  describe("when there is a report", () => {
    beforeEach(() => {
      givenAnAuthenticatedUser();
      reportApiClient.addReports(aReport);
    });

    it("shows the table header", async () => {
      renderReportList();
      for (const header of Object.values(reportListTableLabels.headers)) {
        await screen.findByText(header);
      }
    });

    it("shows it in the table", async () => {
      renderReportList();
      const table = await screen.findByRole("table");

      await screen.findByText(aReportFolderNumber.toString());
      await within(table).findByText("Nouveau");
      await screen.findByText("30/10/2030");
      await screen.findByText("Parquet");
      await screen.findByText("John Doe");
      await screen.findByText("T 8/11/2024 (PG/PR)");
      await screen.findByText("I");
      await screen.findByText("PG TJ Marseille");
      await screen.findByText(aReportObserversCount.toString());
    });

    it("clicks to go to the report overview page", async () => {
      renderReportList();
      await userEvent.click(await screen.findByText(aReport.name));
      expect(routerProvider.onReportOverviewClick).toHaveBeenCalled();
    });

    describe("when there are multiple reports", () => {
      const anotherReport = new ReportApiModelBuilder()
        .with("id", "siege-report-id")
        .with("name", "Another magistrate name")
        .with("transparency", Transparency.AUTOMNE_2024)
        .with("formation", Magistrat.Formation.SIEGE)
        .build();

      beforeEach(() => {
        reportApiClient.addReports(anotherReport);
      });

      it("hides the transparency column for a single transparency", async () => {
        renderReportList(anotherReport.transparency);
        await screen.findByText(anotherReport.name);
        expect(screen.queryByText("Transparence")).toBeNull();
      });

      it("shows reports for a single transparency", async () => {
        renderReportList(anotherReport.transparency);
        await screen.findByText(anotherReport.name);
        expect(screen.queryByText(aReport.name)).toBeNull();
      });

      it("doesn't show 'Parquet' reports when we filter transparency reports on 'Siège'", async () => {
        reportApiClient.addReports(
          new ReportApiModelBuilder()
            .with("id", "parquet-report-id")
            .with("name", "Parquet magistrate name")
            .with("transparency", anotherReport.transparency)
            .with("formation", Magistrat.Formation.PARQUET)
            .build(),
        );
        renderReportList(
          anotherReport.transparency,
          Magistrat.Formation.PARQUET,
        );
        await expect(screen.findByText(anotherReport.name)).rejects.toThrow();
      });
    });
  });

  describe("Files", () => {
    beforeEach(() => {
      givenAnAuthenticatedUser();
    });

    it("doesn't show the title when they are no attachments", async () => {
      renderReportList();
      await expect(screen.findByText("Pièces jointes")).rejects.toThrow();
    });

    describe("With files attached", () => {
      const transparency = Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024;

      beforeEach(() => {
        const attachments = ["file-id-1", "file-id-2"];
        transparencyApiClient.setGdsFiles(transparency, {
          siegeEtParquet: attachments,
          parquet: [],
        });

        const attachmentFiles = attachments.map((fileId, index) => ({
          fileId,
          name: "Attachment name " + index,
          signedUrl: "https://example.com/attachment/" + index,
        }));
        fileApiClient.setFiles(...attachmentFiles);
      });

      it("shows the title", async () => {
        renderReportList(transparency);
        await screen.findByText("Pièces jointes");
      });

      it("lists the attachments", async () => {
        renderReportList(transparency);

        expect(await screen.findByText("Attachment name 0")).toHaveAttribute(
          "href",
          "https://example.com/attachment/0",
        );
        expect(screen.getByText("Attachment name 1")).toHaveAttribute(
          "href",
          "https://example.com/attachment/1",
        );
      });
    });
  });

  const givenAnAuthenticatedUser = () => {
    store.dispatch(authenticate.fulfilled(user, "", userCredentials));
  };

  const renderReportList = (
    transparency?: Transparency,
    formation?: Magistrat.Formation,
  ) => {
    render(
      <Provider store={store}>
        <ReportList
          transparency={transparency || null}
          formation={formation || null}
        />
      </Provider>,
    );
  };
});

const user: AuthenticatedUser = {
  userId: "user-id",
  firstName: "User",
  lastName: "Current",
  role: Role.MEMBRE_COMMUN,
};
const userCredentials: AuthenticateParams = {
  email: "user@example.fr",
  password: "password",
};

const aReportFolderNumber = 1;
const aReportObserversCount = 2;
const aReport = new ReportApiModelBuilder()
  .with("state", NominationFile.ReportState.NEW)
  .with("folderNumber", aReportFolderNumber)
  .with("observersCount", aReportObserversCount)
  .with("transparency", Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024)
  .with("formation", Magistrat.Formation.PARQUET)
  .build();
