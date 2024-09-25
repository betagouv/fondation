import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationCase } from "./NominationCase";
import { Provider } from "react-redux";
import { FakeNominationCaseGateway } from "../../secondary/gateways/FakeNominationCase.gateway";

describe("Nomination Case Component", () => {
  let store: ReduxStore;
  let nominationCaseGateway: FakeNominationCaseGateway;

  beforeEach(() => {
    nominationCaseGateway = new FakeNominationCaseGateway();
    store = initReduxStore({
      nominationCaseGateway,
    });
  });

  it("shows an error message if nomination case is not found", async () => {
    renderNominationCase("invalid-id");
    await screen.findByText("Nomination case not found");
  });

  describe("when nomination case is found", () => {
    beforeEach(() => {
      nominationCaseGateway.nominationCases["nomination-case-id"] = aNomination;
    });

    it("shows its information", async () => {
      renderNominationCase("nomination-case-id");
      await screen.findByText("John Doe");
      await screen.findByText("The biography.");
      await waitFor(() => {
        expect(
          screen.queryByRole("checkbox", { name: "Overseas to overseas" })
        ).not.toBeChecked();
      });
    });
  });

  const renderNominationCase = (id: string) => {
    render(
      <Provider store={store}>
        <NominationCase id={id} />
      </Provider>
    );
  };
});

const aNomination = {
  id: "nomination-case-id",
  name: "John Doe",
  biography: "The biography.",
  preValidatedRules: {
    overseasToOverseas: true,
  },
};
