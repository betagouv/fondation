import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { allRulesMap } from "shared-models";
import App from "./App.tsx";
import { ApiAuthenticationGateway } from "./authentication/adapters/secondary/gateways/ApiAuthentication.gateway.ts";
import { FetchAuthenticationApiClient } from "./authentication/adapters/secondary/gateways/FetchAuthentication.client.ts";
import { LocalStorageLoginNotifierProvider } from "./authentication/adapters/secondary/providers/localStorageLoginNotifier.provider.ts";
import { LocalStorageLogoutNotifierProvider } from "./authentication/adapters/secondary/providers/localStorageLogoutNotifier.provider.ts";
import { initializeAuthenticationState } from "./authentication/core-logic/listeners/authentication.listeners.ts";
import "./index.css";
import { ApiReportGateway } from "./reports/adapters/secondary/gateways/ApiReport.gateway.ts";
import { FetchReportApiClient } from "./reports/adapters/secondary/gateways/FetchReport.client.ts";
import { reportFileAttached } from "./reports/core-logic/listeners/report-file-attached.listeners.ts";
import { routeToReactComponentMap } from "./router/adapters/routeToReactComponentMap.tsx";
import {
  RouteProvider,
  TypeRouterProvider,
} from "./router/adapters/type-route/typeRouter.ts";
import { useRouteChanged } from "./router/adapters/type-route/useRouteChanged.tsx";
import { useRouteToComponentFactory } from "./router/adapters/type-route/useRouteToComponentFactory.tsx";
import { redirectOnLogin } from "./router/core-logic/listeners/redirectOnLogin.listeners.ts";
import { redirectOnLogout } from "./router/core-logic/listeners/redirectOnLogout.listeners.ts";
import { redirectOnRouteChange } from "./router/core-logic/listeners/redirectOnRouteChange.listeners.ts";
import { initReduxStore } from "./store/reduxStore.ts";
import { allRulesLabelsMap } from "./reports/adapters/primary/labels/rules-labels.tsx";

startReactDsfr({ defaultColorScheme: "light" });

const authencationApiClient = new FetchAuthenticationApiClient(
  import.meta.env.VITE_API_URL,
);
const authenticationGateway = new ApiAuthenticationGateway(
  authencationApiClient,
);

const reportApiClient = new FetchReportApiClient(import.meta.env.VITE_API_URL);
const reportGateway = new ApiReportGateway(reportApiClient);

const loginNotifierProvider = new LocalStorageLoginNotifierProvider();
const logoutNotifierProvider = new LocalStorageLogoutNotifierProvider();

const store = initReduxStore<false>(
  { reportGateway, authenticationGateway },
  {
    routerProvider: new TypeRouterProvider(),
    logoutNotifierProvider,
    loginNotifierProvider,
  },
  {
    routeToComponentFactory: useRouteToComponentFactory,
    routeChangedHandler: useRouteChanged,
  },

  {
    initializeAuthenticationState,
    redirectOnRouteChange,
    redirectOnLogout,
    redirectOnLogin,
    reportFileAttached,
  },
  routeToReactComponentMap,
  allRulesMap,
  allRulesLabelsMap,
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
