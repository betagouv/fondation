import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { NominationCaseBuilder } from "../../../../core-logic/builders/nominationCase.builder";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { FakeNominationCaseGateway } from "../../../secondary/gateways/FakeNominationCase.gateway";
import { NominationCaseList } from "./NominationCaseList";

describe("Nomination Case List Component", () => {
  let store: ReduxStore;
  let nominationCaseGateway: FakeNominationCaseGateway;

  beforeEach(() => {
    nominationCaseGateway = new FakeNominationCaseGateway();
    store = initReduxStore(
      {
        nominationCaseGateway,
      },
      {},
      {}
    );
  });

  it("shows an empty list message", async () => {
    renderNominationCaseList();
    await screen.findByText("Aucune nomination.");
  });

  describe("when there is two nomination cases", () => {
    beforeEach(() => {
      nominationCaseGateway.nominationCases[aNominationCase.id] =
        aNominationCase;
      nominationCaseGateway.nominationCases[anotherNominationCase.id] =
        anotherNominationCase;
    });

    it("shows them in the table", async () => {
      renderNominationCaseList();
      await screen.findByText("Lucien Denan");
      await screen.findByText("Another name");
    });
  });

  const renderNominationCaseList = () => {
    render(
      <Provider store={store}>
        <NominationCaseList />
      </Provider>
    );
  };
});

const aNominationCase = new NominationCaseBuilder()
  .withId("nomination-case-id")
  .withName("Lucien Denan")
  .build();
const anotherNominationCase = new NominationCaseBuilder()
  .withId("another-nomination-case-id")
  .withName("Another name")
  .build();
