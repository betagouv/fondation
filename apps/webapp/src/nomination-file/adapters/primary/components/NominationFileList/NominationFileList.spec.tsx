import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { NominationFileBuilder } from "../../../../core-logic/builders/NominationFile.builder";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { FakeNominationFileGateway } from "../../../secondary/gateways/FakeNominationFile.gateway";
import { NominationFileList } from "./NominationFileList";

describe("Nomination Case List Component", () => {
  let store: ReduxStore;
  let nominationCaseGateway: FakeNominationFileGateway;

  beforeEach(() => {
    nominationCaseGateway = new FakeNominationFileGateway();
    store = initReduxStore(
      {
        nominationFileGateway: nominationCaseGateway,
      },
      {},
      {},
    );
  });

  it("shows an empty list message", async () => {
    renderNominationFileList();
    await screen.findByText("Aucune nomination.");
  });

  describe("when there is a nomination case", () => {
    beforeEach(() => {
      nominationCaseGateway.addNominationFile(aNominationFile);
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

const aNominationFile = new NominationFileBuilder().build();
