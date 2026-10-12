import type { BreadcrumbVM } from '@/shared/ui/Breadcrumb';

import { ROUTE_PATHS, type RoutePathSecretariat } from './route-path.utils';

export const getSgBreadCrumb = (path: RoutePathSecretariat): BreadcrumbVM => {
  const SECRETARIAT_GENERAL_ANCHOR_ATTRIBUTES = {
    to: ROUTE_PATHS.SG.DASHBOARD,
  };

  switch (path) {
    case ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE:
      return {
        currentPageLabel: 'Créer une nouvelle transparence',
        segments: [
          {
            label: 'Secrétariat général',
            ...SECRETARIAT_GENERAL_ANCHOR_ATTRIBUTES,
          },
          {
            label: 'Tableau de bord',
            ...SECRETARIAT_GENERAL_ANCHOR_ATTRIBUTES,
          },
        ],
      };

    default:
      return {
        currentPageLabel: 'Tableau de bord',
        segments: [
          {
            label: 'Secrétariat général',
            ...SECRETARIAT_GENERAL_ANCHOR_ATTRIBUTES,
          },
        ],
      };
  }
};
