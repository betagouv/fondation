import Header from '@codegouvfr/react-dsfr/Header';
import type { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';
import { useLocation } from 'react-router-dom';

import { HelpPageButton } from '@/pages/HelpPage';
import { ROUTE_PATHS } from '../../utils/route-path.utils';
import { Avatar } from './Avatar';
import { LolfiCsm } from './LolfiCsm';

export const AppHeader = () => {
  const location = useLocation();
  const includeSg = location.pathname.includes(ROUTE_PATHS.SG.DASHBOARD);

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
      homeLinkProps={{ href: '/', title: 'Accueil' }}
      quickAccessItems={[<HelpPageButton />, <LolfiCsm />, <Avatar />]}
      navigation={includeSg ? navigation : []}
    />
  );
};
