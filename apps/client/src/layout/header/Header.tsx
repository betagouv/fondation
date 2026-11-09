import Header from '@codegouvfr/react-dsfr/Header';
import type { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';
import clsx from 'clsx';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { matchPath, useLocation } from 'react-router';

import { useIsAdmin, useIsSg } from '@/features/auth/hooks/roles.hook';
import { FeedbackHeaderButton } from '@/features/feedback/components/FeedbackHeaderButton';
import { HelpPageButton } from '@/pages/help/HelpPageButton';
import { useArchivedSession } from '@/shared/context/archived-session';
import { usePouvoirDeProposition } from '@/shared/hooks/usePouvoirDeProposition';
import { ROUTE_PATHS, type FondationPath } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

import { Avatar } from './Avatar';
import { LolfiCsm } from './LolfiCsm';
import { ManageSessionsLink } from './ManageSessionsLink';
import { useHeaderBrand } from './useHeaderBrand';

const NAV_ICON_CLASS = "before:mr-2 before:size-5! before:align-middle before:content-['']";

function useRouteMatcher() {
  const { pathname } = useLocation();
  return useCallback(
    (patterns: readonly FondationPath[], options?: { end: boolean }) => {
      return patterns.some(
        (pattern) => matchPath({ end: false, path: pattern, ...options }, pathname) !== null,
      );
    },
    [pathname],
  );
}

/** the DSFR only folds a menu on a full page load: after a client-side navigation it would stay open */
function foldMenus() {
  document
    .querySelectorAll<HTMLButtonElement>('.fr-header .fr-nav__btn[aria-expanded="true"]')
    .forEach((button) => button.click());
}

export const AppHeader = () => {
  const { formatMessage } = useIntl();
  const brand = useHeaderBrand();
  const { pathname } = useLocation();
  const routeMatches = useRouteMatcher();
  const { user } = useUser();
  const isUserSg = useIsSg();
  const isUserAdmin = useIsAdmin();
  const { isArchived } = useArchivedSession();

  // a page common to both pouvoirs, such as the administration, keeps the GDS entries when opened from the GDS
  const isInGdsSpace = usePouvoirDeProposition() === 'GDS';
  const shouldShowNavBar = !!user && pathname !== ROUTE_PATHS.LOGIN;

  const magistratSearchItem = (path: FondationPath): MainNavigationProps.Item => ({
    className: 'lg:ml-auto',
    isActive: routeMatches([path], { end: true }),
    linkProps: { to: path, viewTransition: true },
    text: (
      <span className="fr-icon-search-line inline-flex items-center gap-2 before:size-4!">
        {formatMessage({ defaultMessage: 'Rechercher un magistrat' })}
      </span>
    ),
  });

  const isMemberArchives = isArchived || routeMatches([ROUTE_PATHS.TRANSPARENCES.ARCHIVED_SESSIONS]);
  const memberNavigation: MainNavigationProps.Item[] = [
    {
      isActive: routeMatches([ROUTE_PATHS.TRANSPARENCES.DASHBOARD]) && !isMemberArchives,
      linkProps: { to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD, viewTransition: true },
      text: formatMessage({ defaultMessage: 'Accueil' }),
    },
    {
      isActive: isMemberArchives,
      linkProps: { to: ROUTE_PATHS.TRANSPARENCES.ARCHIVED_SESSIONS, viewTransition: true },
      text: formatMessage({ defaultMessage: 'Archives' }),
    },
    magistratSearchItem(ROUTE_PATHS.MEMBER.MAGISTRAT_SEARCH),
  ];

  const sgNavigation: MainNavigationProps.Item[] = [
    {
      isActive: routeMatches([ROUTE_PATHS.SG.MANAGE_SESSION, ROUTE_PATHS.SG.SESSION_ID]) && !isArchived,
      linkProps: { to: ROUTE_PATHS.SG.MANAGE_SESSION, viewTransition: true },
      text: <ManageSessionsLink />,
    },
    {
      isActive: routeMatches([
        ROUTE_PATHS.SG.PRESENTATIONS_AGENDAS,
        ROUTE_PATHS.SG.PRESENTATIONS_PAST,
        ROUTE_PATHS.SG.PRESENTATIONS_READY,
      ]),
      linkProps: { to: ROUTE_PATHS.SG.PRESENTATIONS_AGENDAS, viewTransition: true },
      text: formatMessage({ defaultMessage: `Restitutions` }),
    },
    {
      isActive: routeMatches([ROUTE_PATHS.SG.MANAGE_MEMBERS, ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER]),
      linkProps: { to: ROUTE_PATHS.SG.MANAGE_MEMBERS, viewTransition: true },
      text: formatMessage({ defaultMessage: 'Gérer les membres' }),
    },
    {
      isActive: isArchived || routeMatches([ROUTE_PATHS.SG.ARCHIVED_SESSIONS]),
      linkProps: { to: ROUTE_PATHS.SG.ARCHIVED_SESSIONS, viewTransition: true },
      text: formatMessage({ defaultMessage: 'Archives' }),
    },
  ];

  const sgCommonNavigation: MainNavigationProps.Item[] = [];
  if (isUserAdmin) {
    sgCommonNavigation.push({
      isActive: routeMatches([
        ROUTE_PATHS.ADMIN.LIST_JOBS,
        ROUTE_PATHS.ADMIN.DETAILS_JOB,
        ROUTE_PATHS.ADMIN.INGEST_LODAM,
        ROUTE_PATHS.ADMIN.INGEST_LOLFI,
        ROUTE_PATHS.ADMIN.USERS,
        ROUTE_PATHS.ADMIN.USER_DETAIL,
        ROUTE_PATHS.ADMIN.FEEDBACKS,
        ROUTE_PATHS.ADMIN.REMARKS,
        ROUTE_PATHS.ADMIN.HELP,
      ]),
      menuLinks: [
        {
          isActive: routeMatches([ROUTE_PATHS.ADMIN.INGEST_LOLFI]),
          linkProps: { onClick: foldMenus, to: ROUTE_PATHS.ADMIN.INGEST_LOLFI, viewTransition: true },
          text: (
            <span className={clsx('fr-icon-upload-2-line', NAV_ICON_CLASS)}>
              {formatMessage({ defaultMessage: 'Importer une archive LOLFI' })}
            </span>
          ),
        },
        {
          isActive: routeMatches([ROUTE_PATHS.ADMIN.LIST_JOBS, ROUTE_PATHS.ADMIN.DETAILS_JOB]),
          linkProps: { onClick: foldMenus, to: ROUTE_PATHS.ADMIN.LIST_JOBS, viewTransition: true },
          text: (
            <span className={clsx('ri-history-line', NAV_ICON_CLASS)}>
              {formatMessage({ defaultMessage: 'Suivre les ingestions' })}
            </span>
          ),
        },
        // a LODAM session belongs to the GDS, unlike the LOLFI archive that also brings the magistrats and the positions
        ...(isInGdsSpace || routeMatches([ROUTE_PATHS.ADMIN.INGEST_LODAM])
          ? [
              {
                isActive: routeMatches([ROUTE_PATHS.ADMIN.INGEST_LODAM]),
                linkProps: { onClick: foldMenus, to: ROUTE_PATHS.ADMIN.INGEST_LODAM, viewTransition: true },
                text: (
                  <span className={clsx('fr-icon-add-circle-line', NAV_ICON_CLASS)}>
                    {formatMessage({ defaultMessage: 'Créer une session' })}
                  </span>
                ),
              },
            ]
          : []),
        {
          isActive: routeMatches([ROUTE_PATHS.ADMIN.USERS, ROUTE_PATHS.ADMIN.USER_DETAIL]),
          linkProps: { onClick: foldMenus, to: ROUTE_PATHS.ADMIN.USERS, viewTransition: true },
          text: (
            <span className={clsx('ri-user-settings-line', NAV_ICON_CLASS)}>
              {formatMessage({ defaultMessage: 'Gérer les utilisateurs' })}
            </span>
          ),
        },
        {
          isActive: routeMatches([ROUTE_PATHS.ADMIN.FEEDBACKS]),
          linkProps: { onClick: foldMenus, to: ROUTE_PATHS.ADMIN.FEEDBACKS, viewTransition: true },
          text: (
            <span className={clsx('fr-icon-feedback-line', NAV_ICON_CLASS)}>
              {formatMessage({ defaultMessage: 'Consulter les avis' })}
            </span>
          ),
        },
        {
          isActive: routeMatches([ROUTE_PATHS.ADMIN.REMARKS]),
          linkProps: { onClick: foldMenus, to: ROUTE_PATHS.ADMIN.REMARKS, viewTransition: true },
          text: (
            <span className={clsx('fr-icon-question-answer-line', NAV_ICON_CLASS)}>
              {formatMessage({ defaultMessage: 'Traiter les retours utilisateurs' })}
            </span>
          ),
        },
        {
          isActive: routeMatches([ROUTE_PATHS.ADMIN.HELP]),
          linkProps: { onClick: foldMenus, to: ROUTE_PATHS.ADMIN.HELP, viewTransition: true },
          text: (
            <span className={clsx('fr-icon-questionnaire-line', NAV_ICON_CLASS)}>
              {formatMessage({ defaultMessage: "Rédiger le centre d'aide" })}
            </span>
          ),
        },
      ],
      text: (
        <span className={clsx('ri-admin-line', NAV_ICON_CLASS)}>
          {formatMessage({ defaultMessage: 'Administration' })}
        </span>
      ),
    });
  }
  sgCommonNavigation.push(magistratSearchItem(ROUTE_PATHS.SG.MAGISTRAT_SEARCH));
  const navigation = !shouldShowNavBar
    ? []
    : !isUserSg
      ? memberNavigation
      : isInGdsSpace
        ? [...sgNavigation, ...sgCommonNavigation]
        : sgCommonNavigation;

  return (
    <Header
      {...brand}
      className="[view-transition-name:app-header]"
      classes={{ menu: 'lg:[&_.fr-nav>ul]:gap-2' }}
      navigation={navigation}
      quickAccessItems={[
        <LolfiCsm key="header lolfi link" />,
        <HelpPageButton key="header help link" />,
        <FeedbackHeaderButton key="header feedback link" />,
        <Avatar key="header avatar" />,
      ]}
    />
  );
};
