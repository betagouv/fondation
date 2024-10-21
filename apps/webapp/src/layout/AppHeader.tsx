import Header from "@codegouvfr/react-dsfr/Header";
import { useAppSelector } from "../nomination-file/adapters/primary/hooks/react-redux";
import { selectLoginHref } from "../router/adapters/selectors/selectLoginHref";
import { selectNominationFileListHref } from "../router/adapters/selectors/selectNominationFileOverviewHref";

export const AppHeader = () => {
  const loginHref = useAppSelector(selectLoginHref);
  const nominationFileOverviewHref = useAppSelector(
    selectNominationFileListHref,
  );

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
        href: loginHref,
        title: "Dossiers de nomination",
      }}
      navigation={[
        {
          linkProps: {
            href: nominationFileOverviewHref,
            target: "_self",
          },
          text: "Mes rapports",
          isActive: true,
        },
      ]}
      quickAccessItems={[
        {
          iconId: "fr-icon-account-fill",
          linkProps: {
            href: loginHref,
          },
          text: "Se déconnecter",
        },
      ]}
    />
  );
};
