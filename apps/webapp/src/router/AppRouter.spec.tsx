import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { authenticate } from "../authentication/core-logic/use-cases/authentication/authenticate";
import { NominationFileBuilder } from "../nomination-file/core-logic/builders/NominationFile.builder";
import { retrieveNominationFile } from "../nomination-file/core-logic/use-cases/nomination-file-retrieval/retrieveNominationFile.use-case";
import { NominationFileSM } from "../nomination-file/store/appState";
import {
  ReduxStore,
  initReduxStore,
} from "../nomination-file/store/reduxStore";
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
    nominationFileOverview: () => <div>an overview</div>,
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
      routeToComponentMap,
    );
  });

  describe("Anonymous visitor", () => {
    it("visits the login page by default", async () => {
      renderAppRouter();
      await screen.findByText("a login");
      expect(window.location.pathname).toBe(routerProvider.getLoginHref());
    });

    it("cannot visit the nomination file list page", async () => {
      act(() => {
        renderAppRouter();
        routerProvider.goToNominationFileList();
      });
      await screen.findByText("a login");
      expect(window.location.pathname).toBe(routerProvider.getLoginHref());
    });

    it("cannot show the nomination file list page before the redirection", async () => {
      store = initReduxStore(
        {},
        { routerProvider },
        {
          routeToComponentFactory: useRouteToComponentFactory,
          // routeChangedHandler is omitted here to prevent the redirection
        },
        [],
        routeToComponentMap,
      );

      act(() => {
        renderAppRouter();
        routerProvider.goToNominationFileList();
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
        }),
      );
    });

    it("visits the nomination file overview page", async () => {
      store.dispatch(retrieveNominationFile.fulfilled(aNomination, "", ""));
      renderAppRouter();

      act(() => {
        routerProvider.gotToNominationFileOverview(aNomination.id);
      });

      expect(await screen.findByText("Mes rapports")).toHaveStyle({
        color: "--text-active-blue-france",
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
      </Provider>,
    );
  };
});

const aNomination: NominationFileSM = new NominationFileBuilder().build();
