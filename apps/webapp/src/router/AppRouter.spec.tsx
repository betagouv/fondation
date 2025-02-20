import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { join } from "node:path";
import { Provider } from "react-redux";
import { Transparency } from "shared-models";
import { ApiAuthenticationGateway } from "../authentication/adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../authentication/adapters/secondary/gateways/FakeAuthentication.client";
import { StubLogoutNotifierProvider } from "../authentication/adapters/secondary/providers/stubLogoutNotifier.provider";
import { AuthenticatedUserSM } from "../authentication/core-logic/gateways/Authentication.gateway";
import { initializeAuthenticationState } from "../authentication/core-logic/listeners/authentication.listeners";
import {
  authenticate,
  AuthenticateParams,
} from "../authentication/core-logic/use-cases/authentication/authenticate";
import { ReportListProps } from "../reports/adapters/primary/components/ReportList/ReportList";
import { sleep } from "../shared-kernel/core-logic/sleep";
import { initReduxStore, ReduxStore } from "../store/reduxStore";
import { RouteToComponentMap } from "./adapters/routeToReactComponentMap";
import {
  RouteProvider,
  routeSegments,
  sessionForTestingPurpose,
  TypeRouterProvider,
} from "./adapters/type-route/typeRouter";
import { useRouteChanged } from "./adapters/type-route/useRouteChanged";
import { useRouteToComponentFactory } from "./adapters/type-route/useRouteToComponentFactory";
import { AppRouter } from "./AppRouter";
import { redirectOnLogin } from "./core-logic/listeners/redirectOnLogin.listeners";
import { redirectOnLogout } from "./core-logic/listeners/redirectOnLogout.listeners";
import { redirectOnRouteChange } from "./core-logic/listeners/redirectOnRouteChange.listeners";

const routeToComponentMap: RouteToComponentMap<false> = {
  login: () => <div>a login</div>,
  transparencies: () => <div>transparencies</div>,
  reportList: (props: ReportListProps) => (
    <div>a list with transparency: {props.transparency}</div>
  ),
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
    await expectLoginPage();
  });

  it("cannot visit the transparencies page", async () => {
    renderAppRouter();
    visit("/transparences");
    await expectLoginPage();
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
      routerProvider.goToTransparencies();
    });

    expect(screen.findByText("transparencies")).rejects.toThrow();
  });

  describe("Authenticated user", () => {
    it("visits the transparencies page by default", async () => {
      renderAppRouter();
      await givenAnAuthenticatedUser();
      await expectTransparenciesPage();
    });

    it("redirects root url to the transparencies page", async () => {
      renderAppRouter();
      await givenAnAuthenticatedUser();

      visit("/");

      await expectTransparenciesPage();
    });

    it("redirects from login to the transparencies page", async () => {
      renderAppRouter();
      await givenAnAuthenticatedUser();

      visit("/login");

      await expectTransparenciesPage();
    });

    it("visits the report list page filtered by transparency", async () => {
      renderAppRouter();
      await givenAnAuthenticatedUser();

      visit(baseTransaparencySegment);

      await expectGdsReportsListPage();
    });

    it("redirects from '/dossiers-de-nomination' to the transparencies page", async () => {
      renderAppRouter();
      await givenAnAuthenticatedUser();

      visit("/dossiers-de-nomination");

      await expectTransparenciesPage();
    });

    it("visits the report overview page", async () => {
      renderAppRouter();
      await givenAnAuthenticatedUser();

      visit(join(baseTransaparencySegment, "some-report-id"));

      await expectGdsReportPage();
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
        await givenAnAuthenticatedUser();

        await userEvent.click(
          screen.getAllByText("Se déconnecter")[elementIndex]!,
        );
        await waitListenersCompletion();

        await expectLoginPage();
      },
    );

    const expectTransparenciesPage = async () => {
      await screen.findByText("transparencies");
      expect(window.location.pathname).toBe("/transparences");
    };
    const expectGdsReportsListPage = async () => {
      await screen.findByText(
        `a list with transparency: ${Transparency.PARQUET_DU_06_FEVRIER_2025}`,
      );
      expect(window.location.pathname).toBe(baseTransaparencySegment);
    };
    const expectGdsReportPage = async () => {
      await screen.findByText("an overview");
      expect(window.location.pathname).toBe(
        join(baseTransaparencySegment, "some-report-id"),
      );
    };
  });

  const visit = async (urlPath: string) => {
    act(() => {
      sessionForTestingPurpose.push(urlPath);
    });
  };

  const expectLoginPage = async () => {
    await screen.findByText("a login");
    expect(window.location.pathname).toBe(routerProvider.getLoginHref());
  };

  const waitListenersCompletion = () => sleep(50);

  const givenAnAuthenticatedUser = async () => {
    await act(async () => {
      apiClient.setEligibleAuthUser(
        userCredentials.email,
        userCredentials.password,
        user.firstName,
        user.lastName,
      );
      store.dispatch(authenticate.fulfilled(user, "", userCredentials));
      await waitListenersCompletion();
    });
  };

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

const baseTransaparencySegment = `/${routeSegments.transparences}/${routeSegments.propositionduGardeDesSceaux}/parquet-du-06-fevrier-2025/${routeSegments.rapports}`;

const user: AuthenticatedUserSM = {
  firstName: "John",
  lastName: "Doe",
};
const userCredentials: AuthenticateParams = {
  email: "user@example.fr",
  password: "password",
};
