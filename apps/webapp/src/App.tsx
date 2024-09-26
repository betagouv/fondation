import "./App.css";
import { NominationCaseOverview } from "./nomination-case/adapters/primary/components/NominationCase";
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
      <NominationCaseOverview id="nomination-case-id" />
    </>
  );
}

export default App;
