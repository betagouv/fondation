import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { NominationFileBuilder } from "../../../../core-logic/builders/NominationFile.builder";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { FakeNominationFileGateway } from "../../../secondary/gateways/FakeNominationFile.gateway";
import { NominationFileList } from "./NominationFileList";
import { FakeAuthenticationGateway } from "../../../../../authentication/adapters/secondary/gateways/fakeAuthentication.gateway";
import { AuthenticatedUser } from "../../../../../authentication/core-logic/gateways/authentication.gateway";

describe("Nomination Case List Component", () => {
  let store: ReduxStore;
  let nominationFileGateway: FakeNominationFileGateway;
  let authenticationGateway: FakeAuthenticationGateway;

  beforeEach(() => {
    nominationFileGateway = new FakeNominationFileGateway();
    authenticationGateway = new FakeAuthenticationGateway();
    authenticationGateway.setEligibleAuthUser(
      "user@example.fr",
      "password",
      true,
      {
        reporterName: user.reporterName,
      },
    );

    store = initReduxStore(
      {
        nominationFileGateway,
        authenticationGateway,
      },
      {},
      {},
      [],
      undefined,
    );
  });

  it("shows an empty list message", async () => {
    renderNominationFileList();
    await screen.findByText("Aucune nomination.");
  });

  describe("when there is a report", () => {
    beforeEach(() => {
      nominationFileGateway.addNominationFile(aNominationFile);
    });

    it("shows the table header", async () => {
      renderNominationFileList();
      await screen.findByText("Etat");
      await screen.findByText("Echéance");
      await screen.findByText("Formation");
      await screen.findByText("Magistrat concerné");
      await screen.findByText("transparence");
      await screen.findByText("Grade visé");
      await screen.findByText("Poste ciblé");
    });

    it("shows it in the table", async () => {
      renderNominationFileList();
      await screen.findByText("Nouveau");
      await screen.findByText("30/10/2030");
      await screen.findByText("Parquet");
      await screen.findByText("John Doe");
      await screen.findByText("transparence de mars 2025");
      await screen.findByText("I");
      await screen.findByText("PG TJ Marseille");
    });
  });

  const renderNominationFileList = () => {
    render(
      <Provider store={store}>
        <NominationFileList />
      </Provider>,
    );
  };
});

const user: AuthenticatedUser = {
  reporterName: "CURRENT User",
};

const aNominationFile = new NominationFileBuilder()
  .withReporterName(user.reporterName)
  .build();
