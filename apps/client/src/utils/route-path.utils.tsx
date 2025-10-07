import type { DateOnlyJson, Magistrat } from 'shared-models';
import { DateTransparenceRoutesMapper } from './date-transparence-routes.utils';
import { FormationsRoutesMapper } from './formations-routes.utils';
import { GdsTransparenciesRoutesMapper } from './gds-transparencies-routes.utils';

export const getGdsDetailsPath = (
  dateTransparence: DateOnlyJson,
  transparency: string,
  formation: Magistrat.Formation,
  sessionId: string
) => {
  return `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/${DateTransparenceRoutesMapper.toPathSegment(dateTransparence)}/${GdsTransparenciesRoutesMapper.toPathSegment(transparency)}/${FormationsRoutesMapper.toPathSegment(formation)}/rapports/${sessionId}`;
};

export const getGdsReportPath = (id: string) => {
  return `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/rapports/${id}`;
};

export const getSgSessionPath = (sessionId: string, sessionImportId: string) => {
  return `/secretariat-general/session/${sessionId}/${sessionImportId}`;
};

interface RoutePath {
  LOGIN: '/login';
  TRANSPARENCES: {
    DASHBOARD: '/transparences';
    DETAILS_GDS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/:dateTransparence/:transparency/:formation/rapports/:sessionId';
    DETAILS_REPORTS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/rapports/:id';
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
      '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/:dateTransparence/:transparency/:formation/rapports/:sessionId',
    DETAILS_REPORTS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/rapports/:id'
  },
  SG: {
    DASHBOARD: '/secretariat-general',
    NOUVELLE_TRANSPARENCE: '/secretariat-general/nouvelle-transparence',
    SESSION_ID: '/secretariat-general/session/:sessionId/:sessionImportId',
    MANAGE_SESSION: '/secretariat-general/sessions'
  }
};

export type RoutePathSecretariat = RoutePath['SG'][keyof RoutePath['SG']];
