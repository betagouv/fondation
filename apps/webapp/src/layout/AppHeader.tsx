import Header from "@codegouvfr/react-dsfr/Header";
import { selectLoginHref } from "../router/adapters/selectors/selectLoginHref";
import { useAppSelector } from "../nomination-file/adapters/primary/hooks/react-redux";

export const AppHeader = () => {
  const loginHref = useAppSelector(selectLoginHref);

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
        href: loginHref,
        title: "Dossiers de nomination",
      }}
    />
  );
};
