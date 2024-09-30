import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import "./index.css";
import { FakeNominationCaseGateway } from "./nomination-case/adapters/secondary/gateways/FakeNominationCase.gateway.ts";
import { initReduxStore } from "./nomination-case/store/reduxStore.ts";

startReactDsfr({ defaultColorScheme: "system" });

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

const store = initReduxStore({ nominationCaseGateway });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
