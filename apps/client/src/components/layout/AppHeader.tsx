import Header from "@codegouvfr/react-dsfr/Header";

import { AppHeaderAvatar } from "./AppHeaderAvatar";

export const AppHeader = () => {
  return (
    <Header
      serviceTitle="Fondation"
      brandTop="CSM"
      operatorLogo={{
        orientation: "horizontal",
        imgUrl: "/logo.png",
        alt: "Conseil Supérieur de la Magistrature",
      }}
      homeLinkProps={{
        href: "/login",
        title: "Accueil",
      }}
      quickAccessItems={[<AppHeaderAvatar />]}
    />
  );
};
