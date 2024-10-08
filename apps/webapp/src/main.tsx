import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import { FakeAuthenticationGateway } from "./authentication/adapters/secondary/gateways/fakeAuthentication.gateway.ts";
import { AuthenticationSessionStorageProvider } from "./authentication/adapters/secondary/providers/authenticationSessionStorage.provider.ts";
import { storeAuthenticationOnLoginSuccess } from "./authentication/core-logic/listeners/authentication.listeners.ts";
import "./index.css";
import { ApiNominationFileGateway } from "./nomination-file/adapters/secondary/gateways/ApiNominationFile.gateway.ts";
import { initReduxStore } from "./nomination-file/store/reduxStore.ts";
import {
  RouteProvider,
  TypeRouterProvider,
} from "./router/adapters/type-route/typeRouter.ts";
import { useRouteChanged } from "./router/adapters/type-route/useRouteChanged.tsx";
import { useRouteToComponentFactory } from "./router/adapters/type-route/useRouteToComponent.tsx";

startReactDsfr({ defaultColorScheme: "light" });

const authenticationGateway = new FakeAuthenticationGateway();
authenticationGateway.setEligibleAuthUser("username", "password", true);

const nominationCaseGateway = new ApiNominationFileGateway();

const authenticationStorageProvider =
  new AuthenticationSessionStorageProvider();

const store = initReduxStore<false>(
  { nominationCaseGateway, authenticationGateway },
  { authenticationStorageProvider, routerProvider: new TypeRouterProvider() },
  {
    routeToComponentFactory: useRouteToComponentFactory,
    routeChangedHandler: useRouteChanged,
  },
  [storeAuthenticationOnLoginSuccess]
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <RouteProvider>
        <App />
      </RouteProvider>
    </Provider>
  </StrictMode>
);
