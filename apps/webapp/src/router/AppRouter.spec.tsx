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
import { RouteToComponentMap } from "./adapters/routeToReactComponentMap";
import {
  RouteProvider,
  TypeRouterProvider,
} from "./adapters/type-route/typeRouter";
import { useRouteToComponentFactory } from "./adapters/type-route/useRouteToComponent";
import { AppRouter } from "./AppRouter";
import { useRouteChanged } from "./adapters/type-route/useRouteChanged";

describe("App Router Component", () => {
  let store: ReduxStore;
  let routerProvider: TypeRouterProvider;
  const routeToComponentMap: RouteToComponentMap = {
    login: () => <div>a login</div>,
    nominationCaseList: () => <div>a list</div>,
    nominationCaseOverview: () => <div>an overview</div>,
  };

  beforeEach(() => {
    routerProvider = new TypeRouterProvider();
    store = initReduxStore(
      {},
      { routerProvider },
      {
        routeToComponentFactory: useRouteToComponentFactory,
        routeChangedHandler: useRouteChanged,
      },
      [],
      routeToComponentMap
    );
  });

  describe("Anonymous visitor", () => {
    it("visits the login page by default", async () => {
      renderAppRouter();
      await screen.findByText("a login");
      expect(window.location.pathname).toBe(routerProvider.getLoginHref());
    });

    it("cannot visit the nomination case list page", async () => {
      act(() => {
        renderAppRouter();
        routerProvider.goToNominationCaseList();
      });
      await screen.findByText("a login");
      expect(window.location.pathname).toBe(routerProvider.getLoginHref());
    });

    it("cannot show the nomination case list page before the redirection", async () => {
      store = initReduxStore(
        {},
        { routerProvider },
        { routeToComponentFactory: useRouteToComponentFactory },
        [],
        routeToComponentMap
      );

      act(() => {
        renderAppRouter();
        routerProvider.goToNominationCaseList();
      });
      expect(screen.findByText("a list")).rejects.toThrow();
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
        routerProvider.gotToNominationCaseOverview(aNomination.id);
      });

      await screen.findByText("an overview");
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
