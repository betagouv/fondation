import type { DateOnlyJson, Magistrat } from 'shared-models';
import { DateTransparenceRoutesMapper } from './date-transparence-routes.utils';
import { GdsTransparenciesRoutesMapper } from './gds-transparencies-routes.utils';
import { FormationsRoutesMapper } from './formations-routes.utils';

export const getGdsDetailsPath = (
  dateTransparence: DateOnlyJson,
  transparency: string,
  formation: Magistrat.Formation
) => {
  return `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/${DateTransparenceRoutesMapper.toPathSegment(dateTransparence)}/${GdsTransparenciesRoutesMapper.toPathSegment(transparency)}/${FormationsRoutesMapper.toPathSegment(formation)}/rapports`;
};

interface RoutePath {
  LOGIN: '/login';
  TRANSPARENCES: {
    DASHBOARD: '/transparences';
    DETAILS_GDS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/:dateTransparence/:transparency/:formation/rapports';
  };
  SG: {
    DASHBOARD: '/secretariat-general';
    NOUVELLE_TRANSPARENCE: '/secretariat-general/nouvelle-transparence';
  };
}

export const ROUTE_PATHS: RoutePath = {
  LOGIN: '/login',
  TRANSPARENCES: {
    DASHBOARD: '/transparences',
    DETAILS_GDS:
      '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/:dateTransparence/:transparency/:formation/rapports'
  },
  SG: {
    DASHBOARD: '/secretariat-general',
    NOUVELLE_TRANSPARENCE: '/secretariat-general/nouvelle-transparence'
  }
};

export type RoutePathSecretariat = RoutePath['SG'][keyof RoutePath['SG']];
