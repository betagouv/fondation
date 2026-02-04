import Header from '@codegouvfr/react-dsfr/Header';
import type { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';

import { HelpPageButton } from '@/pages/HelpPage';
import { useUser } from '@queries/auth.queries';
import { useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from '../../utils/route-path.utils';
import { Avatar } from './Avatar';
import { LolfiCsm } from './LolfiCsm';

export const AppHeader = () => {
  const { pathname } = useLocation();
  const { user } = useUser();
  const includeSg = user?.role === 'ADJOINT_SECRETAIRE_GENERAL' && pathname !== 'login';

  const navigation: MainNavigationProps.Item[] = [
    {
      text: 'Accueil',
      linkProps: { href: '/' },
      isActive: ROUTE_PATHS.SG.DASHBOARD === pathname
    },
    {
      text: 'Créer une session',
      linkProps: { to: ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE },
      isActive: ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE === pathname
    },
    {
      text: 'Gérer une session',
      linkProps: { to: ROUTE_PATHS.SG.MANAGE_SESSION },
      isActive: [
        ROUTE_PATHS.SG.MANAGE_SESSION,
        new RegExp(ROUTE_PATHS.SG.SESSION_ID.replace(':sessionId', '[^/]*'))
      ].some((x) => pathname.match(x))
    },
    {
      text: 'Gérer les membres',
      linkProps: { to: ROUTE_PATHS.SG.MANAGE_MEMBERS },
      isActive: [
        ROUTE_PATHS.SG.MANAGE_MEMBERS,
        new RegExp(ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER.replace(':userId', '[^/]*'))
      ].some((x) => pathname.match(x))
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
