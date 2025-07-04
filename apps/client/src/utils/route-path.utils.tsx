import type { DateOnlyJson, Magistrat, Transparency } from 'shared-models';
import { DateTransparenceRoutesMapper } from './date-transparence-routes.utils';
import { FormationsRoutesMapper } from './formations-routes.utils';
import { GdsTransparenciesRoutesMapper } from './gds-transparencies-routes.utils';

export const getGdsDetailsPath = (
  dateTransparence: DateOnlyJson,
  transparency: string,
  formation: Magistrat.Formation
) => {
  return `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/${DateTransparenceRoutesMapper.toPathSegment(dateTransparence)}/${GdsTransparenciesRoutesMapper.toPathSegment(transparency)}/${FormationsRoutesMapper.toPathSegment(formation)}/rapports`;
};

export const getGdsReportPath = (
  id: string,
  transparency: Transparency,
  formation: Magistrat.Formation,
  dateTransparence: DateOnlyJson
) => {
  const transparencyPath =
    GdsTransparenciesRoutesMapper.toPathSegment(transparency);
  const formationPath = FormationsRoutesMapper.toPathSegment(formation);
  const dateTransparencePath =
    DateTransparenceRoutesMapper.toPathSegment(dateTransparence);

  return `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/${dateTransparencePath}/${transparencyPath}/${formationPath}/rapports/${id}`;
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
