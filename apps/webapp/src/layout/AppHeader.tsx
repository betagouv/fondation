import Header from "@codegouvfr/react-dsfr/Header";
import { logout } from "../authentication/core-logic/use-cases/logout/logout";
import {
  useAppDispatch,
  useAppSelector,
} from "../reports/adapters/primary/hooks/react-redux";
import { selectLoginHref } from "../router/adapters/selectors/selectLoginHref";

export const AppHeader = () => {
  const dispatch = useAppDispatch();

  const loginHref = useAppSelector(selectLoginHref);

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
        title: "Mes rapports",
      }}
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
