import type { DateOnlyJson, Magistrat } from 'shared-models';
import { DateTransparenceRoutesMapper } from './date-transparence-routes.utils';
import { FormationsRoutesMapper } from './formations-routes.utils';
import { GdsTransparenciesRoutesMapper } from './gds-transparencies-routes.utils';

export const ROUTE_PATHS = {
  LOGIN: '/login',
  HELP: '/aide',
  TRANSPARENCES: {
    DASHBOARD: '/transparences',
    DETAIL_SESSION_GDS: `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId`,
    /** @deprecated */
    DETAILS_GDS:
      '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/:dateTransparence/:transparency/:formation/rapports/:sessionId',
    DETAILS_REPORTS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/rapports/:id',
    OBSERVATION_DETAILS:
      '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId/dossiers/:nominationFileId/observations/:observationId'
  },
  SG: {
    DASHBOARD: '/secretariat-general',
    NOUVELLE_TRANSPARENCE: '/secretariat-general/nouvelle-transparence',
    SESSION_ID: '/secretariat-general/session/:sessionId',
    OBSERVATION_DETAILS:
      '/secretariat-general/session/:sessionId/dossiers/:nominationFileId/observations/:observationId',
    MANAGE_SESSION: '/secretariat-general/sessions',
    MANAGE_MEMBERS: '/secretariat-general/membres',
    MANAGE_SINGLE_MEMBER: '/secretariat-general/membres/:userId'
  },

  SUMMARY: '/session/:sessionId/dossier/:fileId/synthese'
} as const;

export type RoutePath = typeof ROUTE_PATHS;

export type RoutePathSecretariat = RoutePath['SG'][keyof RoutePath['SG']];

export function getDetailSessionGdsPath(props: {
  sessionId: string;
  focus?: 'affectations' | 'general';
}): string {
  const path = ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS.replace(':sessionId', props.sessionId);
  return path + (props.focus ? `?focus=${props.focus}` : '');
}

/** @deprecated */
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

export const getSgSessionPath = (sessionId: string) => {
  return `/secretariat-general/session/${sessionId}`;
};

export const getObservationDetailsPath = (
  props: {
    sessionId: string;
    nominationFileId: string;
    observationId: string;
  },
  context: 'sg' | 'membre' = 'sg'
) => {
  if (context === 'membre') {
    return `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/${props.sessionId}/dossiers/${props.nominationFileId}/observations/${props.observationId}`;
  }
  return `/secretariat-general/session/${props.sessionId}/dossiers/${props.nominationFileId}/observations/${props.observationId}`;
};
