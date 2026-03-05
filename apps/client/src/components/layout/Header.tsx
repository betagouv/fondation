import Header from '@codegouvfr/react-dsfr/Header';
import type { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';
import React from 'react';
import { matchPath, useLocation } from 'react-router';

import { useIsSg } from '@/hooks/roles.hook';
import { HelpPageButton } from '@/pages/help/HelpPage';
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

  const includeSg = isUserSg && pathname !== ROUTE_PATHS.LOGIN;

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
      navigation={includeSg ? navigation : []}
    />
  );
};
