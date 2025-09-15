import Header from '@codegouvfr/react-dsfr/Header';

import type { MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../utils/route-path.utils';
import { AppHeaderAvatar } from './AppHeaderAvatar';

export const AppHeader = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const includeSg = pathname.includes(ROUTE_PATHS.SG.DASHBOARD);

  const onClickHandler = (path: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(path);
  };

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
        href: ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE,
        onClick: onClickHandler(ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE),
        target: '_self'
      },
      text: 'Créer une session'
    },
    {
      linkProps: {
        href: ROUTE_PATHS.SG.MANAGE_SESSION,
        onClick: onClickHandler(ROUTE_PATHS.SG.MANAGE_SESSION),
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
