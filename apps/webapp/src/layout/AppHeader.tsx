import Header from "@codegouvfr/react-dsfr/Header";
import {
  useAppDispatch,
  useAppSelector,
} from "../reports/adapters/primary/hooks/react-redux";
import { selectLoginHref } from "../router/adapters/selectors/selectLoginHref";
import { selectReportListHref } from "../router/adapters/selectors/selectReportOverviewHref";
import { logout } from "../authentication/core-logic/use-cases/logout/logout";

export const AppHeader = () => {
  const dispatch = useAppDispatch();

  const loginHref = useAppSelector(selectLoginHref);
  const reportOverviewHref = useAppSelector(selectReportListHref);

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
      navigation={[
        {
          linkProps: {
            href: reportOverviewHref,
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
