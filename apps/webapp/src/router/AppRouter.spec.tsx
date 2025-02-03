import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { ApiAuthenticationGateway } from "../authentication/adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../authentication/adapters/secondary/gateways/FakeAuthentication.client";
import { AuthenticatedUserSM } from "../authentication/core-logic/gateways/Authentication.gateway";
import {
  authenticate,
  AuthenticateParams,
} from "../authentication/core-logic/use-cases/authentication/authenticate";
import { ReportBuilder } from "../reports/core-logic/builders/Report.builder";
import { retrieveReport } from "../reports/core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import { initReduxStore, ReduxStore } from "../store/reduxStore";
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
import { sleep } from "../shared-kernel/core-logic/sleep";
import { StubLogoutNotifierProvider } from "../authentication/adapters/secondary/providers/stubLogoutNotifier.provider";
import { initializeAuthenticationState } from "../authentication/core-logic/listeners/authentication.listeners";

const routeToComponentMap: RouteToComponentMap = {
  login: () => <div>a login</div>,
  reportList: () => <div>a list</div>,
  reportOverview: () => <div>an overview</div>,
};

describe("App Router Component", () => {
  let store: ReduxStore;
  let authenticationGateway: ApiAuthenticationGateway;
  let routerProvider: TypeRouterProvider;
  let apiClient: FakeAuthenticationApiClient;
  let logoutNotifierProvider: StubLogoutNotifierProvider;

  beforeEach(() => {
    apiClient = new FakeAuthenticationApiClient();
    authenticationGateway = new ApiAuthenticationGateway(apiClient);
    routerProvider = new TypeRouterProvider();
    logoutNotifierProvider = new StubLogoutNotifierProvider();

    store = initReduxStore(
      { authenticationGateway },
      { routerProvider, logoutNotifierProvider },
      {
        routeToComponentFactory: useRouteToComponentFactory,
        routeChangedHandler: useRouteChanged,
      },

      {
        redirectOnRouteChange,
        redirectOnLogin,
        redirectOnLogout,
        initializeAuthenticationState,
      },
      routeToComponentMap,
    );
  });

  it("visits the login page by default", async () => {
    renderAppRouter();
    await screen.findByText("a login");
    expect(window.location.pathname).toBe(routerProvider.getLoginHref());
  });

  it("cannot visit the report list page", async () => {
    renderAppRouter();

    act(() => {
      routerProvider.goToReportList();
    });

    await screen.findByText("a login");
    expect(window.location.pathname).toBe(routerProvider.getLoginHref());
  });

  it("cannot show the report list page before the redirection", async () => {
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
      routerProvider.goToReportList();
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
      expect(window.location.pathname).toBe(routerProvider.getReportListHref());
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
      expect(window.location.pathname).toBe(routerProvider.getReportListHref());
    });

    it("visits the report overview page", async () => {
      renderAppRouter();
      act(() => {
        givenAnAuthenticatedUser();
        store.dispatch(retrieveReport.fulfilled(aNominationRetrieved, "", ""));
      });

      await waitListenersCompletion();

      act(() => {
        routerProvider.gotToReportOverview(aNominationRetrieved.id);
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
          routerProvider.goToReportList();
        });

        await screen.findByText("a list");

        await userEvent.click(
          screen.getAllByText("Se déconnecter")[elementIndex]!,
        );

        await waitListenersCompletion();

        await screen.findByText("a login");
      },
    );
  });

  const waitListenersCompletion = () => sleep(50);

  const givenAnAuthenticatedUser = () => {
    apiClient.setEligibleAuthUser(
      userCredentials.email,
      userCredentials.password,
      user.firstName,
      user.lastName,
    );
    store.dispatch(authenticate.fulfilled(user, "", userCredentials));
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

const aNominationRetrieved = new ReportBuilder().buildRetrieveSM();
const user: AuthenticatedUserSM = {
  firstName: "John",
  lastName: "Doe",
};
const userCredentials: AuthenticateParams = {
  email: "user@example.fr",
  password: "password",
};
