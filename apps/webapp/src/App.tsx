import "./App.css";
import { NominationCaseList } from "./nomination-case/adapters/primary/components/NominationCaseList/NominationCaseList";
import { NominationCaseOverview } from "./nomination-case/adapters/primary/components/NominationCaseOverview/NominationCaseOverview";
import { Header } from "@codegouvfr/react-dsfr/Header";

function App() {
  return (
    <>
      <Header
        brandTop={
          <>
            CONSEIL SUPÉRIEUR DE LA MAGISTRATURE
            <br />
            FONDATION
          </>
        }
        homeLinkProps={{
          href: "/",
          title:
            "Accueil - Conseil Supérieur de la Magistrature - Ministère de la Justice",
        }}
      />
      <NominationCaseList />
      <NominationCaseOverview id="nomination-case-id" />
    </>
  );
}

export default App;
