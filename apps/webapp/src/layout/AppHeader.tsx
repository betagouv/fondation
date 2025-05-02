import Header from "@codegouvfr/react-dsfr/Header";
import { useAppSelector } from "../reports/adapters/primary/hooks/react-redux";
import { selectLoginAnchorAttributes } from "../router/adapters/selectors/selectLoginAnchorAttributes";
import { AppHeaderAvatar } from "./AppHeaderAvatar";

export const AppHeader = () => {
  const loginHref = useAppSelector(selectLoginAnchorAttributes);

  return (
    <Header
      serviceTitle="Fondation"
      brandTop={
        <>
          CONSEIL SUPÉRIEUR DE LA MAGISTRATURE
          <br />
          FONDATION
        </>
      }
      homeLinkProps={{
        ...loginHref,
        title: "Mes rapports",
      }}
      quickAccessItems={[<AppHeaderAvatar />]}
    />
  );
};
