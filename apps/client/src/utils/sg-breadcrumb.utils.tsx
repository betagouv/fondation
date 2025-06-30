import type { BreadcrumbVM } from '../models/breadcrumb-vm.model';
import { ROUTE_PATHS, type RoutePathSecretariat } from './route-path.utils';
import type { NavigateFunction } from 'react-router-dom';

export const getSgBreadCrumb = (
  path: RoutePathSecretariat,
  navigate: NavigateFunction
): BreadcrumbVM => {
  const SECRETARIAT_GENERAL_ANCHOR_ATTRIBUTES = {
    href: ROUTE_PATHS.SG.DASHBOARD,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigate(ROUTE_PATHS.SG.DASHBOARD);
    }
  };
  switch (path) {
    case ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE: {
      const secretariatGeneralSegments = [
        {
          label: 'Secretariat général',
          ...SECRETARIAT_GENERAL_ANCHOR_ATTRIBUTES
        },
        {
          label: 'Tableau de bord',
          ...SECRETARIAT_GENERAL_ANCHOR_ATTRIBUTES
        }
      ];
      return {
        currentPageLabel: 'Créer une nouvelle transparence',
        segments: secretariatGeneralSegments
      };
    }
    case ROUTE_PATHS.SG.DASHBOARD: {
      const secretariatGeneralSegments = [
        {
          label: 'Secretariat général',
          ...SECRETARIAT_GENERAL_ANCHOR_ATTRIBUTES
        }
      ];
      return {
        currentPageLabel: 'Tableau de bord',
        segments: secretariatGeneralSegments
      };
    }

    default: {
      const _exhaustiveCheck: never = path;
      console.info(_exhaustiveCheck);
      throw new Error(`Unhandled page: ${path}`);
    }
  }
};
