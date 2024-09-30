import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { authenticate } from "../authentication/core-logic/use-cases/authentication/authenticate";
import {
  ReduxStore,
  initReduxStore,
} from "../nomination-case/store/reduxStore";
import { AppRouter } from "./AppRouter";
import { RouteProvider, routes } from "./router";
import { retrieveNominationCase } from "../nomination-case/core-logic/use-cases/nomination-case-retrieval/retrieveNominationCase.use-case";
import { NominationCaseBuilder } from "../nomination-case/core-logic/builders/nominationCase.builder";
import { NominationCase } from "../nomination-case/store/appState";

describe("App Router Component", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore();
  });

  describe("Anonymous visitor", () => {
    it("cannot see the nomination case overview page", async () => {
      renderAppRouter();
      act(() => {
        routes.nominationCaseList().push();
      });
      await screen.findByPlaceholderText("Identifiant");
    });
  });

  describe("Authenticated user", () => {
    beforeEach(() => {
      store.dispatch(
        authenticate.fulfilled(true, "", {
          username: "username",
          password: "password",
        })
      );
    });

    it("shows the nomination case list page", async () => {
      renderAppRouter();
      await screen.findByText("Aucune nomination.");
    });
    it("shows the nomination case overview page", async () => {
      store.dispatch(retrieveNominationCase.fulfilled(aNomination, "", ""));
      renderAppRouter();

      act(() => {
        routes.nominationCaseOverview({ id: aNomination.id }).push();
      });
      await screen.findByText("Règles de gestion");
    });
  });

  const renderAppRouter = () => {
    render(
      <Provider store={store}>
        <RouteProvider>
          <AppRouter />
        </RouteProvider>
      </Provider>
    );
  };
});

const aNomination: NominationCase = new NominationCaseBuilder().build();
