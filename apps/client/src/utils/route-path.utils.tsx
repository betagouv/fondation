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
  const transparencyPath = GdsTransparenciesRoutesMapper.toPathSegment(transparency);
  const formationPath = FormationsRoutesMapper.toPathSegment(formation);
  const dateTransparencePath = DateTransparenceRoutesMapper.toPathSegment(dateTransparence);

  return `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/${dateTransparencePath}/${transparencyPath}/${formationPath}/rapports/${id}`;
};

export const getSgSessionPath = (sessionId: string, sessionImportId: string) => {
  return `/secretariat-general/session/${sessionId}/${sessionImportId}`;
};

interface RoutePath {
  LOGIN: '/login';
  TRANSPARENCES: {
    DASHBOARD: '/transparences';
    DETAILS_GDS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/:dateTransparence/:transparency/:formation/rapports';
    DETAILS_REPORTS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/:dateTransparence/:transparency/:formation/rapports/:id';
  };
  SG: {
    DASHBOARD: '/secretariat-general';
    NOUVELLE_TRANSPARENCE: '/secretariat-general/nouvelle-transparence';
    SESSION_ID: '/secretariat-general/session/:sessionId/:sessionImportId';
    MANAGE_SESSION: '/secretariat-general/sessions';
  };
}

export const ROUTE_PATHS: RoutePath = {
  LOGIN: '/login',
  TRANSPARENCES: {
    DASHBOARD: '/transparences',
    DETAILS_GDS:
      '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/:dateTransparence/:transparency/:formation/rapports',
    DETAILS_REPORTS:
      '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/:dateTransparence/:transparency/:formation/rapports/:id'
  },
  SG: {
    DASHBOARD: '/secretariat-general',
    NOUVELLE_TRANSPARENCE: '/secretariat-general/nouvelle-transparence',
    SESSION_ID: '/secretariat-general/session/:sessionId/:sessionImportId',
    MANAGE_SESSION: '/secretariat-general/sessions'
  }
};

export type RoutePathSecretariat = RoutePath['SG'][keyof RoutePath['SG']];
