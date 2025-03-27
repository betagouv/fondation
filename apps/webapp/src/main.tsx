import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { allRulesMapV2 } from "shared-models";
import App from "./App.tsx";
import { ApiAuthenticationGateway } from "./authentication/adapters/secondary/gateways/ApiAuthentication.gateway.ts";
import { FetchAuthenticationApiClient } from "./authentication/adapters/secondary/gateways/FetchAuthentication.client.ts";
import { LocalStorageLoginNotifierProvider } from "./authentication/adapters/secondary/providers/localStorageLoginNotifier.provider.ts";
import { LocalStorageLogoutNotifierProvider } from "./authentication/adapters/secondary/providers/localStorageLogoutNotifier.provider.ts";
import { initializeAuthenticationState } from "./authentication/core-logic/listeners/authentication.listeners.ts";
import "./index.css";
import { allRulesLabelsMap } from "./reports/adapters/primary/labels/rules-labels.tsx";
import { ApiReportGateway } from "./reports/adapters/secondary/gateways/ApiReport.gateway.ts";
import { FetchReportApiClient } from "./reports/adapters/secondary/gateways/FetchReport.client.ts";
import { preloadReportsRetrieval } from "./reports/core-logic/listeners/preload-reports-retrieval.listeners.ts";
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
import { RealDateProvider } from "./shared-kernel/adapters/secondary/providers/realDateProvider.ts";
import { RealFileProvider } from "./shared-kernel/adapters/secondary/providers/realFileProvider.ts";
import { initReduxStore } from "./store/reduxStore.ts";
import { reportFilesAttached } from "./reports/core-logic/listeners/report-files-attached.listeners.ts";
import { ApiFileGateway } from "./files/adapters/secondary/gateways/ApiFile.gateway.ts";
import { FetchFileApiClient } from "./files/adapters/secondary/gateways/FetchFile.client.ts";
import { ApiTransparencyGateway } from "./reports/adapters/secondary/gateways/ApiTransparency.gateway.ts";
import { EnvTransparencyApiClient } from "./reports/adapters/secondary/gateways/EnvTransparency.client.ts";

startReactDsfr({ defaultColorScheme: "light" });

const authencationApiClient = new FetchAuthenticationApiClient(
  import.meta.env.VITE_API_URL,
);
const authenticationGateway = new ApiAuthenticationGateway(
  authencationApiClient,
);

const reportApiClient = new FetchReportApiClient(import.meta.env.VITE_API_URL);
const reportGateway = new ApiReportGateway(reportApiClient);

const fileApiClient = new FetchFileApiClient(import.meta.env.VITE_API_URL);
const fileGateway = new ApiFileGateway(fileApiClient);

const transparencyApiClient = new EnvTransparencyApiClient();
const transparencyGateway = new ApiTransparencyGateway(transparencyApiClient);

const loginNotifierProvider = new LocalStorageLoginNotifierProvider();
const logoutNotifierProvider = new LocalStorageLogoutNotifierProvider();

const dateProvider = new RealDateProvider();
const fileProvider = new RealFileProvider();

const store = initReduxStore<false>(
  { reportGateway, authenticationGateway, fileGateway, transparencyGateway },
  {
    routerProvider: new TypeRouterProvider(),
    logoutNotifierProvider,
    loginNotifierProvider,
    fileProvider,
    dateProvider,
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
    reportFilesAttached,
    preloadReportsRetrieval,
  },
  routeToReactComponentMap,
  allRulesMapV2,
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
