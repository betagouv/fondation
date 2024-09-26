import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initReduxStore } from "./nomination-case/store/reduxStore.ts";
import { FakeNominationCaseGateway } from "./nomination-case/adapters/secondary/gateways/FakeNominationCase.gateway.ts";
import { Provider } from "react-redux";

const nominationCaseGateway = new FakeNominationCaseGateway();
nominationCaseGateway.nominationCases["nomination-case-id"] = {
  id: "nomination-case-id",
  name: "John Doe",
  biography: "John Doe's biography",
  preValidatedRules: {
    managementRules: {
      transferTime: true,
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
