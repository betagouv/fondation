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
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import { ReportApiModelBuilder } from "../../../../core-logic/builders/ReportApiModel.builder";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { reportListFilters } from "../../labels/report-list-state-filter-labels.mapper";
import { reportListTableLabels } from "../../labels/report-list-table-labels";
import { reportStateFilterTitle } from "../../labels/state-filter-labels";
import { stateToLabel } from "../../labels/state-label.mapper";
import { ReportList } from "./ReportList";
import { StubRouterProvider } from "../../../../../router/adapters/stubRouterProvider";

describe("Report List Component", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;
  let reportApiClient: FakeReportApiClient;
  let authenticationGateway: ApiAuthenticationGateway;
  let authenticationApiClient: FakeAuthenticationApiClient;

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
  });

  it("shows an empty list message", async () => {
    renderReportList();
    await screen.findByText("Aucun rapport.");
  });

  it("shows the state filters", async () => {
    renderReportList();
    await screen.findByText(reportListFilters.state.title);
  });

  describe("when there is a report", () => {
    beforeEach(() => {
      givenAnAuthenticatedUser();
      reportApiClient.addReports(aReport);
    });

    it("has the state filter set to all by default", async () => {
      renderReportList();
      const select = await screen.findByLabelText(reportStateFilterTitle);
      expect(select).toHaveValue("all");
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
      it("shows the filter options in the right order", async () => {
        renderReportList();
        const select = await screen.findByLabelText(reportStateFilterTitle);
        const options = Array.from(select.querySelectorAll("option")).map(
          (option) => option.textContent,
        );
        expect(options).toEqual([
          "Tous",
          ...[
            NominationFile.ReportState.NEW,
            NominationFile.ReportState.IN_PROGRESS,
            NominationFile.ReportState.READY_TO_SUPPORT,
            NominationFile.ReportState.SUPPORTED,
          ].map(stateToLabel),
        ]);
      });

      it("filters the 'in progress' report", async () => {
        reportApiClient.addReports(
          new ReportApiModelBuilder()
            .with("id", "in-progress-report-id")
            .with("state", NominationFile.ReportState.IN_PROGRESS)
            .with("name", "In Progress Report")
            .build(),
        );
        renderReportList();
        const select = await screen.findByLabelText(reportStateFilterTitle);

        await userEvent.selectOptions(
          select,
          NominationFile.ReportState.IN_PROGRESS,
        );
        expect(select).toHaveValue(NominationFile.ReportState.IN_PROGRESS);
        await screen.findByText("In Progress Report");
        expect(screen.queryByText("John Doe")).toBeNull();
      });

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
