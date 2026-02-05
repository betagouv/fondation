import { generatePath } from 'react-router-dom';

export const ROUTE_PATHS = {
  LOGIN: '/login',
  HELP: '/aide',
  TRANSPARENCES: {
    DASHBOARD: '/transparences',
    DETAIL_SESSION_GDS: `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId`,
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

  SUMMARY: '/session/:sessionId/dossier/:fileId/synthese',
  REDIRECT_MAGISTRAT_LOLFI: '/session/:sessionId/dossier/:fileId/lolfi-magistrat'
} as const;

export type RoutePath = typeof ROUTE_PATHS;

export type FondationPath<Node = RoutePath> = Node extends string ? Node : FondationPath<Node[keyof Node]>;

export type RoutePathSecretariat = RoutePath['SG'][keyof RoutePath['SG']];

export function getDetailSessionGdsPath(props: {
  sessionId: string;
  focus?: 'affectations' | 'general';
}): string {
  const path = generatePath(ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS, { sessionId: props.sessionId });
  return path + (props.focus ? `?focus=${props.focus}` : '');
}

export const getGdsReportPath = (id: string) => {
  return generatePath(ROUTE_PATHS.TRANSPARENCES.DETAILS_REPORTS, { id });
};

export const getSgSessionPath = (sessionId: string) => generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId });

export const getObservationDetailsPath = (
  props: {
    sessionId: string;
    nominationFileId: string;
    observationId: string;
  },
  context: 'sg' | 'membre' = 'sg'
) => {
  const { sessionId, nominationFileId, observationId } = props;
  if (context === 'membre') {
    return generatePath(ROUTE_PATHS.TRANSPARENCES.OBSERVATION_DETAILS, {
      sessionId,
      nominationFileId,
      observationId
    });
  }

  return generatePath(ROUTE_PATHS.SG.OBSERVATION_DETAILS, {
    sessionId,
    nominationFileId,
    observationId
  });
};
