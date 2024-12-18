import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import { FakeAuthenticationGateway } from "./authentication/adapters/secondary/gateways/fakeAuthentication.gateway.ts";
import { AuthenticationSessionStorageProvider } from "./authentication/adapters/secondary/providers/authenticationSessionStorage.provider.ts";
import { storeAuthenticationOnLoginSuccess } from "./authentication/core-logic/listeners/authentication.listeners.ts";
import { storeDisconnectionOnLogout } from "./authentication/core-logic/listeners/logout.listeners.ts";
import "./index.css";
import { ApiReportGateway } from "./reports/adapters/secondary/gateways/ApiReport.gateway.ts";
import { FetchReportApiClient } from "./reports/adapters/secondary/gateways/FetchReport.client.ts";
import { initReduxStore } from "./store/reduxStore.ts";
import {
  RouteProvider,
  TypeRouterProvider,
} from "./router/adapters/type-route/typeRouter.ts";
import { useRouteChanged } from "./router/adapters/type-route/useRouteChanged.tsx";
import { useRouteToComponentFactory } from "./router/adapters/type-route/useRouteToComponent.tsx";
import { redirectOnLogin } from "./router/core-logic/listeners/redirectOnLogin.listeners.ts";
import { redirectOnLogout } from "./router/core-logic/listeners/redirectOnLogout.listeners.ts";
import { redirectOnRouteChange } from "./router/core-logic/listeners/redirectOnRouteChange.listeners.ts";
import { reportFileAttached } from "./reports/core-logic/listeners/report-file-attached.listeners.ts";
import { routeToReactComponentMap } from "./router/adapters/routeToReactComponentMap.tsx";
import { allRulesMap } from "shared-models";

startReactDsfr({ defaultColorScheme: "light" });

const authenticationGateway = new FakeAuthenticationGateway();

const fakeUsersString = import.meta.env.VITE_FAKE_USERS;
const fakeUsers: {
  username: string;
  password: string;
  reporterName: string;
}[] = fakeUsersString ? JSON.parse(fakeUsersString) : [];
fakeUsers.forEach(({ username, password, reporterName }) => {
  if (!username) {
    throw new Error("Missing username in fake user");
  }
  if (!password) {
    throw new Error("Missing password in fake user");
  }
  authenticationGateway.setEligibleAuthUser(
    username,
    password,
    reporterName ? { reporterName } : undefined,
  );
});

const reportApiClient = new FetchReportApiClient(import.meta.env.VITE_API_URL);
const reportGateway = new ApiReportGateway(reportApiClient);

const authenticationStorageProvider =
  new AuthenticationSessionStorageProvider();

const store = initReduxStore<false>(
  { reportGateway, authenticationGateway },
  { authenticationStorageProvider, routerProvider: new TypeRouterProvider() },
  {
    routeToComponentFactory: useRouteToComponentFactory,
    routeChangedHandler: useRouteChanged,
  },

  {
    storeAuthenticationOnLoginSuccess,
    storeDisconnectionOnLogout,
    redirectOnRouteChange,
    redirectOnLogout,
    redirectOnLogin,
    reportFileAttached,
  },
  routeToReactComponentMap,
  allRulesMap,
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <RouteProvider>
        <App />
      </RouteProvider>
    </Provider>
  </StrictMode>,
);
