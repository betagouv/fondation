import Header from "@codegouvfr/react-dsfr/Header";
import { routes } from "../router/router";

export const AppHeader = () => {
  return (
    <Header
      brandTop={
        <>
          CONSEIL SUPÉRIEUR DE LA MAGISTRATURE
          <br />
          FONDATION
        </>
      }
      homeLinkProps={{
        href: routes.nominationCaseList().href,
        title: "Dossiers de nomination",
      }}
    />
  );
};
