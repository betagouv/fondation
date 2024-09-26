import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationCaseOverview } from "./NominationCase";
import { Provider } from "react-redux";
import { FakeNominationCaseGateway } from "../../secondary/gateways/FakeNominationCase.gateway";
import { NominationCase } from "../../../store/appState";
import { NominationCaseBuilder } from "../../../core-logic/builders/nominationCase.builder";

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
        expectRuleUnchecked("Transfer time");
        expectRuleUnchecked("Getting first grade");
        expectRuleUnchecked("Getting grade HH");
        expectRuleUnchecked("Getting grade in place");
        expectRuleUnchecked("Profiled position");
        expectRuleUnchecked("Cassation court nomination");
        expectRuleUnchecked("Overseas to overseas");
        expectRuleUnchecked("Judiciary role and jurisdiction degree change");
        expectRuleUnchecked(
          "Judiciary role and jurisdiction degree change in same ressort"
        );
      });
    });
  });

  const renderNominationCase = (id: string) => {
    render(
      <Provider store={store}>
        <NominationCaseOverview id={id} />
      </Provider>
    );
  };

  const expectRuleUnchecked = (name: string) => {
    expect(screen.queryByRole("checkbox", { name })).not.toBeChecked();
  };
});

const aNomination: NominationCase = new NominationCaseBuilder()
  .withId("nomination-case-id")
  .withName("John Doe")
  .withBiography("The biography.")
  .build();
