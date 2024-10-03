import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import { FakeAuthenticationGateway } from "./authentication/adapters/secondary/gateways/fakeAuthentication.gateway.ts";
import { AuthenticationSessionStorageProvider } from "./authentication/adapters/secondary/providers/authenticationSessionStorage.provider.ts";
import { storeAuthenticationOnLoginSuccess } from "./authentication/core-logic/listeners/authentication.listeners.ts";
import "./index.css";
import { FakeNominationCaseGateway } from "./nomination-case/adapters/secondary/gateways/FakeNominationCase.gateway.ts";
import { initReduxStore } from "./nomination-case/store/reduxStore.ts";
import {
  RouteProvider,
  TypeRouterProvider,
} from "./router/adapters/type-route/typeRouter.ts";
import { useRouteChanged } from "./router/adapters/type-route/useRouteChanged.tsx";
import { routeToReactComponentMap } from "./router/adapters/routeToReactComponentMap.tsx";
import { useRouteToComponentFactory } from "./router/adapters/type-route/useRouteToComponent.tsx";

startReactDsfr({ defaultColorScheme: "system" });

const authenticationGateway = new FakeAuthenticationGateway();
authenticationGateway.setEligibleAuthUser("username", "password", true);

const nominationCaseGateway = new FakeNominationCaseGateway();
nominationCaseGateway.nominationCases["nomination-case-id"] = {
  id: "nomination-case-id",
  name: "Julien Lavigne",
  biography:
    "Procureur général près la cour d'appel de Paris, 1er grade, nommé en 2019.",
  preValidatedRules: {
    managementRules: {
      transferTime: false,
      gettingFirstGrade: true,
      gettingGradeHH: true,
      gettingGradeInPlace: true,
      profiledPosition: true,
      cassationCourtNomination: true,
      overseasToOverseas: true,
      judiciaryRoleAndJuridictionDegreeChange: true,
      judiciaryRoleAndJuridictionDegreeChangeInSameRessort: true,
    },
  },
};

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
