import Header from "@codegouvfr/react-dsfr/Header";
import {
  useAppDispatch,
  useAppSelector,
} from "../nomination-file/adapters/primary/hooks/react-redux";
import { selectLoginHref } from "../router/adapters/selectors/selectLoginHref";
import { selectNominationFileListHref } from "../router/adapters/selectors/selectNominationFileOverviewHref";
import { logout } from "../authentication/core-logic/use-cases/logout/logout";

export const AppHeader = () => {
  const dispatch = useAppDispatch();

  const loginHref = useAppSelector(selectLoginHref);
  const nominationFileOverviewHref = useAppSelector(
    selectNominationFileListHref,
  );

  const onClickLogout = () => {
    dispatch(logout());
  };

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
          buttonProps: {
            onClick: onClickLogout,
          },
          text: "Se déconnecter",
        },
      ]}
    />
  );
};
