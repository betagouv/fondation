import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { ReportBuilder } from "../../../../core-logic/builders/Report.builder";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { FakeReportGateway } from "../../../secondary/gateways/FakeReport.gateway";
import { ReportList } from "./ReportList";
import { FakeAuthenticationGateway } from "../../../../../authentication/adapters/secondary/gateways/fakeAuthentication.gateway";
import { AuthenticatedUser } from "../../../../../authentication/core-logic/gateways/authentication.gateway";
import { authenticate } from "../../../../../authentication/core-logic/use-cases/authentication/authenticate";

describe("Nomination Case List Component", () => {
  let store: ReduxStore;
  let reportGateway: FakeReportGateway;
  let authenticationGateway: FakeAuthenticationGateway;

  beforeEach(() => {
    reportGateway = new FakeReportGateway();
    authenticationGateway = new FakeAuthenticationGateway();
    authenticationGateway.setEligibleAuthUser(
      "user@example.fr",
      "password",
      user,
    );

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
    await screen.findByText("Aucune nomination.");
  });

  describe("when there is a report", () => {
    beforeEach(() => {
      givenAnAuthenticatedUser();
      reportGateway.addReport(aReport);
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
      await screen.findByText("1");
      await screen.findByText("Nouveau");
      await screen.findByText("30/10/2030");
      await screen.findByText("Parquet");
      await screen.findByText("John Doe");
      await screen.findByText("Mars 2025");
      await screen.findByText("I");
      await screen.findByText("PG TJ Marseille");
      await screen.findByText("2");
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

const aReport = new ReportBuilder()
  .with("reporterName", user.reporterName)
  .buildListVM();
