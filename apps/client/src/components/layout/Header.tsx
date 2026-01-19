import Header from '@codegouvfr/react-dsfr/Header';
import type { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';

import { HelpPageButton } from '@/pages/HelpPage';
import { useUser } from '@queries/auth.queries';
import { ROUTE_PATHS } from '../../utils/route-path.utils';
import { Avatar } from './Avatar';
import { LolfiCsm } from './LolfiCsm';
import { useLocation } from 'react-router-dom';

export const AppHeader = () => {
  const { pathname } = useLocation();
  const { user } = useUser();
  const includeSg = user?.role === 'ADJOINT_SECRETAIRE_GENERAL' && pathname !== 'login';

  const navigation: MainNavigationProps.Item[] = [
    {
      text: 'Accueil',
      linkProps: { href: '/' }
    },
    {
      text: 'Créer une session',
      linkProps: { to: ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE }
    },
    {
      text: 'Gérer une session',
      linkProps: { to: ROUTE_PATHS.SG.MANAGE_SESSION }
    },
    {
      text: 'Gérer les membres',
      linkProps: { to: ROUTE_PATHS.SG.MANAGE_MEMBERS }
    },
    {
      text: 'Archives',
      linkProps: {
        href: '#',
        target: '_self',
        'aria-disabled': true
      }
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
