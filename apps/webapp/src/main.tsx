import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import { FakeAuthenticationGateway } from "./authentication/adapters/secondary/gateways/fakeAuthentication.gateway.ts";
import { AuthenticationSessionStorageProvider } from "./authentication/adapters/secondary/providers/authenticationSessionStorage.provider.ts";
import { storeAuthenticationOnLoginSuccess } from "./authentication/core-logic/listeners/authentication.listeners.ts";
import "./index.css";
import { ApiReportGateway } from "./reports/adapters/secondary/gateways/ApiReport.gateway.ts";
import { initReduxStore } from "./reports/store/reduxStore.ts";
import {
  RouteProvider,
  TypeRouterProvider,
} from "./router/adapters/type-route/typeRouter.ts";
import { useRouteChanged } from "./router/adapters/type-route/useRouteChanged.tsx";
import { useRouteToComponentFactory } from "./router/adapters/type-route/useRouteToComponent.tsx";
import { NestiaReportClient } from "./reports/adapters/secondary/gateways/NestiaReport.client.ts";
import { storeDisconnectionOnLogout } from "./authentication/core-logic/listeners/logout.listeners.ts";
import { redirectOnRouteChange } from "./router/core-logic/listeners/redirectOnRouteChange.listeners.ts";
import { redirectOnLogout } from "./router/core-logic/listeners/redirectOnLogout.listeners.ts";
import { redirectOnLogin } from "./router/core-logic/listeners/redirectOnLogin.listeners.ts";

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

const nestiaReportClient = new NestiaReportClient();
const reportGateway = new ApiReportGateway(nestiaReportClient);

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
  },
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
