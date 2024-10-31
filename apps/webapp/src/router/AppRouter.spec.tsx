import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { FakeAuthenticationGateway } from "../authentication/adapters/secondary/gateways/fakeAuthentication.gateway";
import { authenticate } from "../authentication/core-logic/use-cases/authentication/authenticate";
import { NominationFileBuilder } from "../nomination-file/core-logic/builders/NominationFile.builder";
import { retrieveNominationFile } from "../nomination-file/core-logic/use-cases/nomination-file-retrieval/retrieveNominationFile.use-case";
import { NominationFileSM } from "../nomination-file/store/appState";
import {
  initReduxStore,
  ReduxStore,
} from "../nomination-file/store/reduxStore";
import { RouteToComponentMap } from "./adapters/routeToReactComponentMap";
import {
  RouteProvider,
  sessionForTestingPurpose,
  TypeRouterProvider,
} from "./adapters/type-route/typeRouter";
import { useRouteChanged } from "./adapters/type-route/useRouteChanged";
import { useRouteToComponentFactory } from "./adapters/type-route/useRouteToComponent";
import { AppRouter } from "./AppRouter";
import { redirectOnLogin } from "./core-logic/listeners/redirectOnLogin.listeners";
import { redirectOnLogout } from "./core-logic/listeners/redirectOnLogout.listeners";
import { redirectOnRouteChange } from "./core-logic/listeners/redirectOnRouteChange.listeners";

const routeToComponentMap: RouteToComponentMap = {
  login: () => <div>a login</div>,
  nominationCaseList: () => <div>a list</div>,
  nominationFileOverview: () => <div>an overview</div>,
};

describe("App Router Component", () => {
  let store: ReduxStore;
  let authenticationGateway: FakeAuthenticationGateway;
  let routerProvider: TypeRouterProvider;

  beforeEach(() => {
    authenticationGateway = new FakeAuthenticationGateway();
    routerProvider = new TypeRouterProvider();

    store = initReduxStore(
      { authenticationGateway },
      { routerProvider },
      {
        routeToComponentFactory: useRouteToComponentFactory,
        routeChangedHandler: useRouteChanged,
      },

      { redirectOnRouteChange, redirectOnLogin, redirectOnLogout },
      routeToComponentMap,
    );
  });

  it("visits the login page by default", async () => {
    renderAppRouter();
    await screen.findByText("a login");
    expect(window.location.pathname).toBe(routerProvider.getLoginHref());
  });

  it("cannot visit the nomination file list page", async () => {
    renderAppRouter();

    act(() => {
      routerProvider.goToNominationFileList();
    });

    await screen.findByText("a login");
    expect(window.location.pathname).toBe(routerProvider.getLoginHref());
  });

  it("cannot show the nomination file list page before the redirection", async () => {
    store = initReduxStore(
      { authenticationGateway },
      { routerProvider },
      {
        routeToComponentFactory: useRouteToComponentFactory,
        // routeChangedHandler is omitted here to prevent the redirection
      },
      {},
      routeToComponentMap,
    );
    renderAppRouter();

    act(() => {
      routerProvider.goToNominationFileList();
    });

    expect(screen.findByText("a list")).rejects.toThrow();
  });

  describe("Authenticated user", () => {
    it("visits the reports list page by default", async () => {
      renderAppRouter();
      act(() => {
        givenAnAuthenticatedUser();
      });

      act(() => {
        sessionForTestingPurpose.push("/");
      });

      await screen.findByText("a list");
      expect(window.location.pathname).toBe(
        routerProvider.getNominationFileListHref(),
      );
    });

    it("redirects from login to the reports list page", async () => {
      renderAppRouter();
      act(() => {
        givenAnAuthenticatedUser();
      });

      act(() => {
        routerProvider.goToLogin();
      });

      await screen.findByText("a list");
      expect(window.location.pathname).toBe(
        routerProvider.getNominationFileListHref(),
      );
    });

    it("visits the nomination file overview page", async () => {
      renderAppRouter();
      act(() => {
        givenAnAuthenticatedUser();
        store.dispatch(retrieveNominationFile.fulfilled(aNomination, "", ""));
      });

      act(() => {
        routerProvider.gotToNominationFileOverview(aNomination.id);
      });

      expect(await screen.findByText("Mes rapports")).toHaveStyle({
        color: "--text-active-blue-france",
      });
      await screen.findByText("an overview");
    });

    const logoutTestData: {
      elementIndex: number;
      device: "desktop" | "mobile";
    }[] = [
      { elementIndex: 0, device: "desktop" },
      { elementIndex: 1, device: "mobile" },
    ];
    it.each(logoutTestData)(
      "on $device, it disconnects the user and redirects it to the login page",
      async ({ elementIndex }) => {
        renderAppRouter();
        act(() => {
          givenAnAuthenticatedUser();
          routerProvider.goToNominationFileList();
        });
        await screen.findByText("a list");

        await userEvent.click(
          screen.getAllByText("Se déconnecter")[elementIndex]!,
        );

        await screen.findByText("a login");
      },
    );
  });

  const givenAnAuthenticatedUser = () => {
    store.dispatch(
      authenticate.fulfilled(null, "", {
        email: "username@example.fr",
        password: "password",
      }),
    );
  };

  function renderAppRouter() {
    return render(
      <Provider store={store}>
        <RouteProvider>
          <AppRouter />
        </RouteProvider>
      </Provider>,
    );
  }
});

const aNomination: NominationFileSM = new NominationFileBuilder().build();
