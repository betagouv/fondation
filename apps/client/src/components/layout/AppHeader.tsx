import Header from "@codegouvfr/react-dsfr/Header";
import { Link, useLocation } from "react-router-dom";
import { AppHeaderAvatar } from "./AppHeaderAvatar";

export const AppHeader = () => {
  const location = useLocation();

  const navigationItems = [
    {
      text: "Transparences",
      linkProps: {
        to: "/transparences",
        as: Link,
      },
      isActive:
        location.pathname === "/transparences" || location.pathname === "/",
    },
    {
      text: "Secrétariat Général",
      linkProps: {
        to: "/secretariat-general",
        as: Link,
      },
      isActive: location.pathname === "/secretariat-general",
    },
  ];

  return (
    <Header
      serviceTitle="Fondation"
      brandTop="CSM"
      operatorLogo={{
        orientation: "horizontal",
        imgUrl: "/logo.png",
        alt: "Conseil Supérieur de la Magistrature",
      }}
      // homeLinkProps={{
      //   ...loginHref,
      //   title: "Accueil",
      // }}
      navigation={navigationItems}
      quickAccessItems={[<AppHeaderAvatar />]}
    />
  );
};
