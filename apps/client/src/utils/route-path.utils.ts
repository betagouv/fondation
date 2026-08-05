import { generatePath, redirect } from 'react-router';

export const ROUTE_PATHS = {
  LOGIN: '/login',
  HELP: '/aide',
  USER_MANUAL: '/aide/manuel',
  TRANSPARENCES: {
    DASHBOARD: '/transparences',
    DETAIL_SESSION_GDS: `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId`,
    DETAILS_REPORTS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/rapports/:id',
    OBSERVATION_DETAILS:
      '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId/dossiers/:nominationFileId/observations/:observationId',
    MAGISTRAT_DETAILS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/magistrats/:magistratId',
  },
  MEMBER: {
    MAGISTRAT_DETAILS: '/magistrats/:magistratId',
  },
  SG: {
    DASHBOARD: '/secretariat-general',
    NOUVELLE_TRANSPARENCE: '/secretariat-general/nouvelle-transparence',
    SESSION_ID: '/secretariat-general/session/:sessionId',
    SESSION_ID_EDIT: '/secretariat-general/session/:sessionId/edit',
    OBSERVATION_DETAILS:
      '/secretariat-general/session/:sessionId/dossiers/:nominationFileId/observations/:observationId',
    MAGISTRAT_DETAILS: '/secretariat-general/magistrats/:magistratId',
    MANAGE_SESSION: '/secretariat-general/sessions',
    ARCHIVED_SESSIONS: '/secretariat-general/archives/sessions',
    MANAGE_MEMBERS: '/secretariat-general/membres',
    MANAGE_SINGLE_MEMBER: '/secretariat-general/membres/:userId',
    AGENDA_NEW: '/secretariat-general/session/:sessionId/docs/ordre-du-jour',
    AGENDA_UPDATE_METADATA:
      '/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/metadonnees',
    AGENDA_UPDATE_FILES: '/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/dossiers',
    AGENDA_PREVIEW: '/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/validation',
    AGENDA_RENDER: '/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/validation/apercu',
    OFFICIAL_REPORT_NEW: '/secretariat-general/session/:sessionId/docs/pv',
    OFFICIAL_REPORT_UPDATE: '/secretariat-general/session/:sessionId/docs/pv/:officialReportId',
    OFFICIAL_REPORT_PREVIEW: '/secretariat-general/session/:sessionId/docs/pv/:officialReportId/validation',
    OFFICIAL_REPORT_RENDER:
      '/secretariat-general/session/:sessionId/docs/pv/:officialReportId/validation/apercu',

    PRESENTATIONS_READY: '/secretariat-general/restitutions/a-restituer',
    PRESENTATIONS_PAST: '/secretariat-general/restitutions/passees',
    PRESENTATIONS_NEW: '/secretariat-general/restitutions/nouvelle-notice',
    PRESENTATIONS_UPDATE: '/secretariat-general/restitutions/:planId',
    PRESENTATIONS_PREVIEW: '/secretariat-general/restitutions/:planId/validation',
  },

  ADMIN: {
    ROOT: '/admin',
    LIST_JOBS: '/admin/jobs',
    DETAILS_JOB: '/admin/jobs/:jobId',
    INGEST_LOLFI: '/admin/lolfi',
    USERS: '/admin/users',
    USER_DETAIL: '/admin/users/:userId',
  },

  SUMMARY: '/session/:sessionId/dossier/:fileId/synthese',
  REDIRECT_MAGISTRAT_LOLFI: '/session/:sessionId/dossier/:fileId/lolfi-magistrat',
} as const;

export type RoutePath = typeof ROUTE_PATHS;

export type FondationPath<Node = RoutePath> = Node extends string ? Node : FondationPath<Node[keyof Node]>;

export type RoutePathSecretariat = RoutePath['SG'][keyof RoutePath['SG']];

export const getNewAgendaPath = (sessionId: string): string =>
  generatePath(ROUTE_PATHS.SG.AGENDA_NEW, { sessionId });

export function getDetailSessionGdsPath(props: {
  sessionId: string;
  focus?: 'affectations' | 'general';
}): string {
  const path = generatePath(ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS, {
    sessionId: props.sessionId,
  });
  return path + (props.focus ? `?focus=${props.focus}` : '');
}

export const getGdsReportPath = (id: string) => {
  return generatePath(ROUTE_PATHS.TRANSPARENCES.DETAILS_REPORTS, { id });
};

export const getObservationDetailsPath = (props: {
  sessionId: string;
  nominationFileId: string;
  observationId: string;
  context: 'sg' | 'membre';
}) => {
  const { sessionId, nominationFileId, observationId } = props;
  if (props.context === 'membre') {
    return generatePath(ROUTE_PATHS.TRANSPARENCES.OBSERVATION_DETAILS, {
      sessionId,
      nominationFileId,
      observationId,
    });
  }

  return generatePath(ROUTE_PATHS.SG.OBSERVATION_DETAILS, {
    sessionId,
    nominationFileId,
    observationId,
  });
};

// TODO: remove once the old member URL has faded from bookmarks and shared links
export const redirectToMemberMagistratDetails = ({ params }: { params: { magistratId?: string } }) =>
  redirect(getMagistratDetailsPath({ context: 'membre', magistratId: params.magistratId ?? '' }));

export const getMagistratDetailsPath = (props: { magistratId: string; context: 'sg' | 'membre' }) => {
  if (props.context === 'membre') {
    return generatePath(ROUTE_PATHS.MEMBER.MAGISTRAT_DETAILS, { magistratId: props.magistratId });
  }

  return generatePath(ROUTE_PATHS.SG.MAGISTRAT_DETAILS, { magistratId: props.magistratId });
};
