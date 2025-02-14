import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { AuthenticatedUser, NominationFile } from "shared-models";
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

describe("Report List Component", () => {
  let store: ReduxStore;
  let reportApiClient: FakeReportApiClient;
  let authenticationGateway: ApiAuthenticationGateway;
  let authenticationApiClient: FakeAuthenticationApiClient;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
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

    const reportGateway = new ApiReportGateway(reportApiClient);

    store = initReduxStore(
      {
        reportGateway,
        authenticationGateway,
      },
      {},
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
      reportApiClient.addReport(aReport);
    });

    it("has the state filter set to all by default", async () => {
      renderReportList();
      const select = await screen.findByLabelText(reportStateFilterTitle);
      expect(select).toHaveValue("all");
    });

    it("shows the table header", async () => {
      renderReportList();
      for (const header of reportListTableLabels.headers) {
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
        reportApiClient.addReport(
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
    });
  });

  const givenAnAuthenticatedUser = () => {
    store.dispatch(authenticate.fulfilled(user, "", userCredentials));
  };

  const renderReportList = () => {
    render(
      <Provider store={store}>
        <ReportList />
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
