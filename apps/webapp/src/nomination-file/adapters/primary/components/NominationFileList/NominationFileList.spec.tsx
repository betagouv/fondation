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
        nominationCaseGateway,
      },
      {},
      {}
    );
  });

  it("shows an empty list message", async () => {
    renderNominationFileList();
    await screen.findByText("Aucune nomination.");
  });

  describe("when there is a nomination case", () => {
    beforeEach(() => {
      nominationCaseGateway.nominationFiles[aNominationFile.id] =
        aNominationFile;
    });

    it("shows it in the table", async () => {
      renderNominationFileList();
      await screen.findByText("Lucien Denan");
      await screen.findByText("30/10/2030");
    });
  });

  const renderNominationFileList = () => {
    render(
      <Provider store={store}>
        <NominationFileList />
      </Provider>
    );
  };
});

const aNominationFile = new NominationFileBuilder()
  .withId("nomination-file-id")
  .withTitle("Lucien Denan")
  .withDueDate("2030-10-30")
  .build();
