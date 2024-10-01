import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { authenticate } from "../authentication/core-logic/use-cases/authentication/authenticate";
import { NominationCaseBuilder } from "../nomination-case/core-logic/builders/nominationCase.builder";
import { retrieveNominationCase } from "../nomination-case/core-logic/use-cases/nomination-case-retrieval/retrieveNominationCase.use-case";
import { NominationCase } from "../nomination-case/store/appState";
import {
  ReduxStore,
  initReduxStore,
} from "../nomination-case/store/reduxStore";
import { AppRouter } from "./AppRouter";
import { RouteProvider, routes } from "./router";

describe("App Router Component", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore(undefined, undefined);
  });

  describe("Anonymous visitor", () => {
    it("visits the login page by default", async () => {
      renderAppRouter();
      await screen.findByPlaceholderText("Identifiant");
      expect(window.location.pathname).toBe(routes.login().href);
    });

    it("cannot visit the nomination case list page", async () => {
      act(() => {
        renderAppRouter();
        routes.nominationCaseList().push();
      });
      await screen.findByPlaceholderText("Identifiant");
      expect(window.location.pathname).toBe(routes.login().href);
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

    it("visits the nomination case overview page", async () => {
      store.dispatch(retrieveNominationCase.fulfilled(aNomination, "", ""));
      renderAppRouter();

      act(() => {
        routes.nominationCaseOverview({ id: aNomination.id }).push();
      });

      await screen.findByText("Règles de gestion");
    });
  });

  const renderAppRouter = () => {
    return render(
      <Provider store={store}>
        <RouteProvider>
          <AppRouter />
        </RouteProvider>
      </Provider>
    );
  };
});

const aNomination: NominationCase = new NominationCaseBuilder().build();
