import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { NominationFile } from "shared-models";
import { FakeAuthenticationGateway } from "../../../../../authentication/adapters/secondary/gateways/fakeAuthentication.gateway";
import { AuthenticatedUser } from "../../../../../authentication/core-logic/gateways/authentication.gateway";
import { authenticate } from "../../../../../authentication/core-logic/use-cases/authentication/authenticate";
import { ReportApiModelBuilder } from "../../../../core-logic/builders/ReportApiModel.builder";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { reportListFilters } from "../../labels/report-list-state-filter-labels.mapper";
import { reportStateFilterTitle } from "../../labels/state-filter-labels";
import { ReportList } from "./ReportList";

describe("Nomination Case List Component", () => {
  let store: ReduxStore;
  let reportApiClient: FakeReportApiClient;
  let authenticationGateway: FakeAuthenticationGateway;

  beforeEach(() => {
    authenticationGateway = new FakeAuthenticationGateway();
    authenticationGateway.setEligibleAuthUser(
      "user@example.fr",
      "password",
      user,
    );

    reportApiClient = new FakeReportApiClient();
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
      await screen.findByText("N° dossier");
      await screen.findByText("Etat");
      await screen.findByText("Echéance");
      await screen.findByText("Formation");
      await screen.findByText("Magistrat concerné");
      await screen.findByText("Transparence");
      await screen.findByText("Grade actuel");
      await screen.findByText("Poste ciblé");
      await screen.findByText("Observants");
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
      it("filters the 'in progress' report", async () => {
        reportApiClient.addReport(
          new ReportApiModelBuilder()
            .with("id", "in-progress-report-id")
            .with("state", NominationFile.ReportState.IN_PROGRESS)
            .with("reporterName", user.reporterName)
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
    store.dispatch(
      authenticate.fulfilled(user, "", {
        email: "user@example.fr",
        password: "password",
      }),
    );
  };

  const renderReportList = () => {
    render(
      <Provider store={store}>
        <ReportList />
      </Provider>,
    );
  };
});

const user = {
  reporterName: "CURRENT User",
} satisfies AuthenticatedUser;

const aReportFolderNumber = 1;
const aReportObserversCount = 2;
const aReport = new ReportApiModelBuilder()
  .with("state", NominationFile.ReportState.NEW)
  .with("reporterName", user.reporterName)
  .with("folderNumber", aReportFolderNumber)
  .with("observersCount", aReportObserversCount)
  .build();
