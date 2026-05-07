import Header from '@codegouvfr/react-dsfr/Header';
import type { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';
import React from 'react';
import { useIntl } from 'react-intl';
import { matchPath, useLocation } from 'react-router';

import { useIsAdmin, useIsSg } from '@/hooks/roles.hook';
import { HelpPageButton } from '@/pages/help/HelpPage';
import { ROUTE_PATHS, type FondationPath } from '@/utils/route-path.utils';

import { Avatar } from './Avatar';
import { LolfiCsm } from './LolfiCsm';
import { ManageSessionsLink } from './ManageSessionsLink';

function useRouteMatcher() {
  const { pathname } = useLocation();
  return React.useCallback(
    (patterns: readonly FondationPath[], options?: { end: boolean }) => {
      return patterns.some(
        (pattern) => matchPath({ path: pattern, end: false, ...options }, pathname) !== null,
      );
    },
    [pathname],
  );
}

export const AppHeader = () => {
  const { $t } = useIntl();
  const { pathname } = useLocation();
  const routeMatches = useRouteMatcher();
  const isUserSg = useIsSg();
  const isUserAdmin = useIsAdmin();

  const shouldShowNavBar = (isUserAdmin || isUserSg) && pathname !== ROUTE_PATHS.LOGIN;

  const navigation: MainNavigationProps.Item[] = [
    {
      text: 'Accueil',
      linkProps: { href: '/' },
      isActive: routeMatches([ROUTE_PATHS.SG.DASHBOARD], { end: true }),
    },
    {
      text: 'Créer une session',
      linkProps: { to: ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE },
      isActive: routeMatches([ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE]),
    },
    {
      text: <ManageSessionsLink />,
      linkProps: { to: ROUTE_PATHS.SG.MANAGE_SESSION },
      isActive: routeMatches([ROUTE_PATHS.SG.MANAGE_SESSION, ROUTE_PATHS.SG.SESSION_ID]),
    },
    {
      text: $t({ defaultMessage: `Restitutions` }),
      linkProps: { to: ROUTE_PATHS.SG.PRESENTATIONS_READY },
      isActive: routeMatches([ROUTE_PATHS.SG.PRESENTATIONS_PAST, ROUTE_PATHS.SG.PRESENTATIONS_READY]),
    },
    {
      text: 'Gérer les membres',
      linkProps: { to: ROUTE_PATHS.SG.MANAGE_MEMBERS },
      isActive: routeMatches([ROUTE_PATHS.SG.MANAGE_MEMBERS, ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER]),
    },
  ];

  if (isUserAdmin) {
    navigation.push({
      text: (
        <span className="ri-admin-line before:size-5!! before:mr-2 before:align-middle before:content-['']">
          Administration
        </span>
      ),
      isActive: routeMatches([
        ROUTE_PATHS.ADMIN.LIST_JOBS,
        ROUTE_PATHS.ADMIN.DETAILS_JOB,
        ROUTE_PATHS.ADMIN.INGEST_LOLFI,
        ROUTE_PATHS.ADMIN.USERS,
        ROUTE_PATHS.ADMIN.USER_DETAIL,
      ]),
      menuLinks: [
        {
          linkProps: { to: ROUTE_PATHS.ADMIN.INGEST_LOLFI },
          text: (
            <span className="fr-icon-file-add-line before:size-5!! before:mr-2 before:align-middle before:content-['']">
              Import LOLFI manuel
            </span>
          ),
          isActive: routeMatches([ROUTE_PATHS.ADMIN.INGEST_LOLFI]),
        },
        {
          linkProps: { to: ROUTE_PATHS.ADMIN.LIST_JOBS },
          text: (
            <span className="ri-play-circle-line before:mr-2 before:size-5! before:align-middle before:content-['']">
              Ingestions
            </span>
          ),
          isActive: routeMatches([ROUTE_PATHS.ADMIN.LIST_JOBS, ROUTE_PATHS.ADMIN.DETAILS_JOB]),
        },
        {
          linkProps: { to: ROUTE_PATHS.ADMIN.USERS },
          text: (
            <span className="ri-user-settings-line before:mr-2 before:size-5! before:align-middle before:content-['']">
              Gestion des utilisateurs
            </span>
          ),
          isActive: routeMatches([ROUTE_PATHS.ADMIN.USERS, ROUTE_PATHS.ADMIN.USER_DETAIL]),
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
        alt: 'Conseil Supérieur de la Magistrature',
      }}
      homeLinkProps={{ to: '/', title: 'Accueil' }}
      quickAccessItems={[
        <HelpPageButton key="header help link" />,
        <LolfiCsm key="header lolfi link" />,
        <Avatar key="header avatar" />,
      ]}
      navigation={shouldShowNavBar ? navigation : []}
    />
  );
};
