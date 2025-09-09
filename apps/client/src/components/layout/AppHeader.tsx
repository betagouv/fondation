import Header from '@codegouvfr/react-dsfr/Header';

import { AppHeaderAvatar } from './AppHeaderAvatar';
import type { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';
import { useLocation } from 'react-router-dom';
import { ROUTE_PATHS } from '../../utils/route-path.utils';

export const AppHeader = () => {
  const { pathname } = useLocation();
  const includeSg = pathname.includes(ROUTE_PATHS.SG.DASHBOARD);

  const navigation: MainNavigationProps.Item[] = [
    {
      linkProps: {
        href: '#',
        target: '_self'
      },
      text: 'Accueil'
    },
    {
      linkProps: {
        href: '#',
        target: '_self'
      },
      text: 'Créer une session'
    },
    {
      linkProps: {
        href: '#',
        target: '_self'
      },
      text: 'Gérer une session'
    },
    {
      linkProps: {
        href: '#',
        target: '_self'
      },
      text: 'Gérer les membres'
    },
    {
      linkProps: {
        href: '#',
        target: '_self'
      },
      text: 'Archives'
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
      homeLinkProps={{
        href: '/login',
        title: 'Accueil'
      }}
      quickAccessItems={[<AppHeaderAvatar />]}
      navigation={includeSg ? navigation : []}
    />
  );
};
