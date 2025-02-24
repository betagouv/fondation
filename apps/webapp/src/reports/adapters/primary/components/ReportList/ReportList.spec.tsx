import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { AuthenticatedUser, NominationFile, Transparency } from "shared-models";
import { ApiAuthenticationGateway } from "../../../../../authentication/adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../../../../authentication/adapters/secondary/gateways/FakeAuthentication.client";
import {
  authenticate,
  AuthenticateParams,
} from "../../../../../authentication/core-logic/use-cases/authentication/authenticate";
import { StubRouterProvider } from "../../../../../router/adapters/stubRouterProvider";
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import { ReportApiModelBuilder } from "../../../../core-logic/builders/ReportApiModel.builder";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { reportListTableLabels } from "../../labels/report-list-table-labels";
import { ReportList } from "./ReportList";
import _ from "lodash";
import {
  ExpectTransparenciesBreadcrumb,
  expectTransparenciesBreadcrumbFactory,
} from "../../../../../test/breadcrumb";

describe("Report List Component", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;
  let reportApiClient: FakeReportApiClient;
  let authenticationGateway: ApiAuthenticationGateway;
  let authenticationApiClient: FakeAuthenticationApiClient;
  let expectTransparenciesBreadcrumb: ExpectTransparenciesBreadcrumb;

  beforeEach(() => {
    authenticationApiClient = new FakeAuthenticationApiClient();
    authenticationApiClient.setEligibleAuthUser(
      userCredentials.email,
      userCredentials.password,
      user.firstName,
      user.lastName,
    );
    authenticationGateway = new ApiAuthenticationGateway(
      authenticationApiClient,
    );

    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);

    routerProvider = new StubRouterProvider();
    routerProvider.onReportOverviewClick = vi.fn();

    store = initReduxStore(
      {
        reportGateway,
        authenticationGateway,
      },
      { routerProvider },
      {},
      {},
      undefined,
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
      await screen.findByText("Mars 2025");
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
      it("hides the transparency column for a single transparency", async () => {
        renderReportList(aReport.transparency);
        await screen.findByText("John Doe");
        expect(screen.queryByText("Transparence")).toBeNull();
      });

      it("shows reports for a single transparency", async () => {
        reportApiClient.addReports(
          new ReportApiModelBuilder()
            .with("id", "other-report-id")
            .with("name", "Another magistrate name")
            .with("state", NominationFile.ReportState.IN_PROGRESS)
            .with("transparency", Transparency.PARQUET_DU_06_FEVRIER_2025)
            .build(),
        );

        renderReportList(aReport.transparency);

        await screen.findByText("John Doe");
        expect(screen.queryByText("Another magistrate name")).toBeNull();
      });
    });
  });

  const givenAnAuthenticatedUser = () => {
    store.dispatch(authenticate.fulfilled(user, "", userCredentials));
  };

  const renderReportList = (transparency?: Transparency) => {
    render(
      <Provider store={store}>
        <ReportList transparency={transparency} />
      </Provider>,
    );
  };
});

const user: AuthenticatedUser = {
  userId: "user-id",
  firstName: "User",
  lastName: "Current",
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
  .build();
