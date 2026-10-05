import Header from '@codegouvfr/react-dsfr/Header';
import type { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { matchPath, useLocation } from 'react-router';

import { useIsAdmin, useIsSg } from '@/features/auth/hooks/roles.hook';
import { HelpPageButton } from '@/pages/help/HelpPageButton';
import { ROUTE_PATHS, type FondationPath } from '@/utils/route-path.utils';

import { Avatar } from './Avatar';
import { LolfiCsm } from './LolfiCsm';
import { ManageSessionsLink } from './ManageSessionsLink';

function useRouteMatcher() {
  const { pathname } = useLocation();
  return useCallback(
    (patterns: readonly FondationPath[], options?: { end: boolean }) => {
      return patterns.some(
        (pattern) => matchPath({ path: pattern, end: false, ...options }, pathname) !== null,
      );
    },
    [pathname],
  );
}

export const AppHeader = () => {
  const { formatMessage } = useIntl();
  const { pathname } = useLocation();
  const routeMatches = useRouteMatcher();
  const isUserSg = useIsSg();
  const isUserAdmin = useIsAdmin();

  const shouldShowNavBar = (isUserAdmin || isUserSg) && pathname !== ROUTE_PATHS.LOGIN;

  const navigation: MainNavigationProps.Item[] = [
    {
      text: formatMessage({ defaultMessage: 'Accueil' }),
      linkProps: { href: '/' },
      isActive: routeMatches([ROUTE_PATHS.SG.DASHBOARD], { end: true }),
    },
    {
      text: formatMessage({ defaultMessage: 'Créer une session' }),
      linkProps: { to: ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE },
      isActive: routeMatches([ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE]),
    },
    {
      text: <ManageSessionsLink />,
      linkProps: { to: ROUTE_PATHS.SG.MANAGE_SESSION },
      isActive: routeMatches([ROUTE_PATHS.SG.MANAGE_SESSION, ROUTE_PATHS.SG.SESSION_ID]),
    },
    {
      text: formatMessage({ defaultMessage: `Restitutions` }),
      linkProps: { to: ROUTE_PATHS.SG.PRESENTATIONS_AGENDAS },
      isActive: routeMatches([
        ROUTE_PATHS.SG.PRESENTATIONS_AGENDAS,
        ROUTE_PATHS.SG.PRESENTATIONS_PAST,
        ROUTE_PATHS.SG.PRESENTATIONS_READY,
      ]),
    },
    {
      text: formatMessage({ defaultMessage: 'Gérer les membres' }),
      linkProps: { to: ROUTE_PATHS.SG.MANAGE_MEMBERS },
      isActive: routeMatches([ROUTE_PATHS.SG.MANAGE_MEMBERS, ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER]),
    },
    {
      text: formatMessage({ defaultMessage: 'Archives' }),
      linkProps: { to: ROUTE_PATHS.SG.ARCHIVED_SESSIONS },
      isActive: routeMatches([ROUTE_PATHS.SG.ARCHIVED_SESSIONS]),
    },
  ];

  if (isUserAdmin) {
    navigation.push({
      text: (
        <span className="ri-admin-line before:size-5!! before:mr-2 before:align-middle before:content-['']">
          {formatMessage({ defaultMessage: 'Administration' })}
        </span>
      ),
      isActive: routeMatches([
        ROUTE_PATHS.ADMIN.LIST_JOBS,
        ROUTE_PATHS.ADMIN.DETAILS_JOB,
        ROUTE_PATHS.ADMIN.INGEST_LOLFI,
        ROUTE_PATHS.ADMIN.USERS,
        ROUTE_PATHS.ADMIN.USER_DETAIL,
        ROUTE_PATHS.ADMIN.SESSION_FEEDBACKS,
      ]),
      menuLinks: [
        {
          linkProps: { to: ROUTE_PATHS.ADMIN.INGEST_LOLFI },
          text: (
            <span className="fr-icon-file-add-line before:size-5!! before:mr-2 before:align-middle before:content-['']">
              {formatMessage({ defaultMessage: 'Import LOLFI manuel' })}
            </span>
          ),
          isActive: routeMatches([ROUTE_PATHS.ADMIN.INGEST_LOLFI]),
        },
        {
          linkProps: { to: ROUTE_PATHS.ADMIN.LIST_JOBS },
          text: (
            <span className="ri-play-circle-line before:mr-2 before:size-5! before:align-middle before:content-['']">
              {formatMessage({ defaultMessage: 'Ingestions' })}
            </span>
          ),
          isActive: routeMatches([ROUTE_PATHS.ADMIN.LIST_JOBS, ROUTE_PATHS.ADMIN.DETAILS_JOB]),
        },
        {
          linkProps: { to: ROUTE_PATHS.ADMIN.USERS },
          text: (
            <span className="ri-user-settings-line before:mr-2 before:size-5! before:align-middle before:content-['']">
              {formatMessage({ defaultMessage: 'Gestion des utilisateurs' })}
            </span>
          ),
          isActive: routeMatches([ROUTE_PATHS.ADMIN.USERS, ROUTE_PATHS.ADMIN.USER_DETAIL]),
        },
        {
          linkProps: { to: ROUTE_PATHS.ADMIN.SESSION_FEEDBACKS },
          text: (
            <span className="fr-icon-feedback-line before:mr-2 before:size-5! before:align-middle before:content-['']">
              {formatMessage({ defaultMessage: 'Avis des utilisateurs' })}
            </span>
          ),
          isActive: routeMatches([ROUTE_PATHS.ADMIN.SESSION_FEEDBACKS]),
        },
      ],
    });
  }

  return (
    <Header
      serviceTitle="Fondation"
      brandTop="CSM"
      operatorLogo={{
        orientation: 'horizontal',
        imgUrl: '/logo.png',
        alt: formatMessage({ defaultMessage: 'Conseil Supérieur de la Magistrature' }),
      }}
      homeLinkProps={{ to: '/', title: formatMessage({ defaultMessage: 'Accueil' }) }}
      quickAccessItems={[
        <HelpPageButton key="header help link" />,
        <LolfiCsm key="header lolfi link" />,
        <Avatar key="header avatar" />,
      ]}
      navigation={shouldShowNavBar ? navigation : []}
    />
  );
};
