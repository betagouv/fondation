import { act, render, screen } from "@testing-library/react";
import { join } from "node:path";
import { Provider } from "react-redux";
import { Gender, Magistrat, Role, Transparency } from "shared-models";
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
import { FormationsRoutesMapper } from "./core-logic/models/formations-routes-mapper";
import { GdsTransparenciesRoutesMapper } from "./core-logic/models/gds-transparencies-routes-mapper";

const routeToComponentMap: RouteToComponentMap<false> = {
  login: () => <div>a login</div>,
  transparencies: () => <div>transparencies</div>,
  reportList: (props: Partial<ReportListProps>) => (
    <div>a list with transparency: {props.transparency}</div>
  ),
  reportOverview: () => <div>an overview</div>,
  secretariatGeneral: () => <div>Tableau de bord</div>,
  sgNouvelleTransparence: () => <div>Nouvelle transparence</div>,
};

export const getTestDependencies = () => {
  const apiClient = new FakeAuthenticationApiClient();
  const authenticationGateway = new ApiAuthenticationGateway(apiClient);
  const routerProvider = new TypeRouterProvider();
  const logoutNotifierProvider = new StubLogoutNotifierProvider();

  const store = initReduxStore(
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

  const initStoreNoRouteChangedHandler = () =>
    initReduxStore(
      { authenticationGateway },
      { routerProvider },
      {
        routeToComponentFactory: useRouteToComponentFactory,
        // routeChangedHandler is omitted here to prevent the redirection
      },
      {},
      routeToComponentMap,
    );

  const expectTransparenciesPage = async () => {
    await screen.findByText("transparencies");
    expect(window.location.pathname).toBe("/transparences");
  };
  const expectGdsReportsListPage = async () => {
    await screen.findByText(
      `a list with transparency: ${Transparency.PARQUET_DU_06_FEVRIER_2025}`,
    );
    expect(window.location.pathname).toBe(
      join(
        baseTransaparencySegment,
        FormationsRoutesMapper.formationToPathSegmentMap[
          Magistrat.Formation.PARQUET
        ],
        routeSegments.rapports,
      ),
    );
  };
  const expectGdsReportPage = async () => {
    await screen.findByText("an overview");
    expect(window.location.pathname).toBe(
      join(baseTransaparencySegment, routeSegments.rapports, "some-report-id"),
    );
  };

  const expectDisallowedGdsReportPage = async () =>
    expect(screen.findByText("an overview")).rejects.toThrow();

  const visitTransparencyPerFormationReports = async () =>
    visit(
      join(
        baseTransaparencySegment,
        FormationsRoutesMapper.formationToPathSegmentMap[
          Magistrat.Formation.PARQUET
        ],
        routeSegments.rapports,
      ),
    );

  const visitSomeReport = async () =>
    visit(
      join(baseTransaparencySegment, routeSegments.rapports, "some-report-id"),
    );

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

  const givenAnAuthenticatedUser = async (user: AuthenticatedUserSM) => {
    await act(async () => {
      apiClient.setEligibleAuthUser(
        userCredentials.email,
        userCredentials.password,
        user.firstName,
        user.lastName,
        user.role,
        user.gender,
      );
      store.dispatch(authenticate.fulfilled(user, "", userCredentials));
      await waitListenersCompletion();
    });
  };

  const givenAnAuthenticatedAdjointSecrétaireGénéral = async () =>
    givenAnAuthenticatedUser(adjointSecrétaireGénéral);

  const givenAnAuthenticatedMembre = async () =>
    givenAnAuthenticatedUser(membreCommun);

  const renderAppRouter = (aStore: ReduxStore = store) => {
    return render(
      <Provider store={aStore}>
        <RouteProvider>
          <AppRouter />
        </RouteProvider>
      </Provider>,
    );
  };

  return {
    store,
    initStoreNoRouteChangedHandler,
    apiClient,
    authenticationGateway,
    routerProvider,
    logoutNotifierProvider,
    expectTransparenciesPage,
    expectGdsReportsListPage,
    expectGdsReportPage,
    expectDisallowedGdsReportPage,
    visitTransparencyPerFormationReports,
    visitSomeReport,
    visit,
    expectLoginPage,
    waitListenersCompletion,
    givenAnAuthenticatedMembre,
    givenAnAuthenticatedAdjointSecrétaireGénéral,
    renderAppRouter,
  };
};

export type TestDependencies = ReturnType<typeof getTestDependencies>;

const baseTransaparencySegment = join(
  `/${routeSegments.transparences}`,
  routeSegments.propositionduGardeDesSceaux,
  GdsTransparenciesRoutesMapper.transparencyToPathSegmentMap[
    Transparency.PARQUET_DU_06_FEVRIER_2025
  ],
);

const membreCommun: AuthenticatedUserSM = {
  firstName: "John",
  lastName: "Doe",
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};
export const adjointSecrétaireGénéral: AuthenticatedUserSM = {
  firstName: "Jane",
  lastName: "Smith",
  role: Role.ADJOINT_SECRETAIRE_GENERAL,
  gender: Gender.F,
};

const userCredentials: AuthenticateParams = {
  email: "user@example.fr",
  password: "password",
};
