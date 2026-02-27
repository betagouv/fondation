import Header from '@codegouvfr/react-dsfr/Header';
import type { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';
import React from 'react';
import { matchPath, useLocation } from 'react-router';

import { useIsAdmin, useIsSg } from '@/hooks/roles.hook';
import { HelpPageButton } from '@/pages/HelpPage';
import { ROUTE_PATHS, type FondationPath } from '@/utils/route-path.utils';
import { Avatar } from './Avatar';
import { LolfiCsm } from './LolfiCsm';

function useRouteMatcher() {
  const { pathname } = useLocation();
  return React.useCallback(
    (patterns: readonly FondationPath[], options?: { end: boolean }) => {
      return patterns.some(
        (pattern) => matchPath({ path: pattern, end: false, ...options }, pathname) !== null
      );
    },
    [pathname]
  );
}

export const AppHeader = () => {
  const { pathname } = useLocation();
  const routeMatches = useRouteMatcher();
  const isUserSg = useIsSg();
  const isUserAdmin = useIsAdmin();

  const shouldShowNavBar = (isUserAdmin || isUserSg) && pathname !== ROUTE_PATHS.LOGIN;

  const navigation: MainNavigationProps.Item[] = [
    {
      text: 'Accueil',
      linkProps: { href: '/' },
      isActive: routeMatches([ROUTE_PATHS.SG.DASHBOARD], { end: true })
    },
    {
      text: 'Créer une session',
      linkProps: { to: ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE },
      isActive: routeMatches([ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE])
    },
    {
      text: 'Gérer une session',
      linkProps: { to: ROUTE_PATHS.SG.MANAGE_SESSION },
      isActive: routeMatches([ROUTE_PATHS.SG.MANAGE_SESSION, ROUTE_PATHS.SG.SESSION_ID])
    },
    {
      text: 'Gérer les membres',
      linkProps: { to: ROUTE_PATHS.SG.MANAGE_MEMBERS },
      isActive: routeMatches([ROUTE_PATHS.SG.MANAGE_MEMBERS, ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER])
    }
  ];

  if (isUserAdmin) {
    navigation.push({
      text: (
        <span className="ri-admin-line before:mr-2 before:size-5 before:align-middle before:content-['']">
          Administration
        </span>
      ),
      isActive: routeMatches([
        ROUTE_PATHS.ADMIN.LIST_JOBS,
        ROUTE_PATHS.ADMIN.DETAILS_JOB,
        ROUTE_PATHS.ADMIN.INGEST_LOLFI
      ]),
      menuLinks: [
        {
          linkProps: { to: ROUTE_PATHS.ADMIN.INGEST_LOLFI },
          text: (
            <span className="fr-icon-file-add-line before:mr-2 before:size-5 before:align-middle before:content-['']">
              Import LOLFI manuel
            </span>
          ),
          isActive: routeMatches([ROUTE_PATHS.ADMIN.INGEST_LOLFI])
        },
        {
          linkProps: { to: ROUTE_PATHS.ADMIN.LIST_JOBS },
          text: (
            <span className="ri-play-circle-line before:mr-2 before:size-5 before:align-middle before:content-['']">
              Ingestions
            </span>
          ),
          isActive: routeMatches([ROUTE_PATHS.ADMIN.LIST_JOBS, ROUTE_PATHS.ADMIN.DETAILS_JOB])
        }
      ]
    });
  }

  return (
    <Header
      serviceTitle="Fondation"
      brandTop="CSM"
      operatorLogo={{
        orientation: 'horizontal',
        imgUrl: '/logo.png',
        alt: 'Conseil Supérieur de la Magistrature'
      }}
      homeLinkProps={{ to: '/', title: 'Accueil' }}
      quickAccessItems={[<HelpPageButton />, <LolfiCsm />, <Avatar />]}
      navigation={shouldShowNavBar ? navigation : []}
    />
  );
};
