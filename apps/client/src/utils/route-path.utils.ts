import { generatePath, redirect } from 'react-router';

export const SIDE_PANEL_DOSSIER_PARAM = 'dossier';

export const ROUTE_PATHS = {
  ACCESSIBILITY: '/accessibilite',
  ADMIN: {
    DETAILS_JOB: '/admin/jobs/:jobId',
    FEEDBACKS: '/admin/avis',
    INGEST_LOLFI: '/admin/lolfi',
    LIST_JOBS: '/admin/jobs',
    ROOT: '/admin',
    USERS: '/admin/users',
    USER_DETAIL: '/admin/users/:userId',
  },
  FEEDBACK: '/avis',
  HELP: '/aide',
  LOGIN: '/login',
  MEMBER: {
    MAGISTRAT_DETAILS: '/magistrats/:magistratId',
  },
  REDIRECT_MAGISTRAT_LOLFI: '/session/:sessionId/dossier/:fileId/lolfi-magistrat',
  SG: {
    AGENDA_EDIT: '/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/validation/edition',
    AGENDA_NEW: '/secretariat-general/session/:sessionId/docs/ordre-du-jour',
    AGENDA_PREVIEW: '/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/validation',
    AGENDA_UPDATE_FILES: '/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/dossiers',
    AGENDA_UPDATE_METADATA:
      '/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/metadonnees',
    ARCHIVED_SESSIONS: '/secretariat-general/archives/sessions',
    DASHBOARD: '/secretariat-general',
    MAGISTRAT_DETAILS: '/secretariat-general/magistrats/:magistratId',
    MANAGE_MEMBERS: '/secretariat-general/membres',
    MANAGE_SESSION: '/secretariat-general/sessions',
    MANAGE_SINGLE_MEMBER: '/secretariat-general/membres/:userId',
    NOUVELLE_TRANSPARENCE: '/secretariat-general/nouvelle-transparence',
    OBSERVATION_DETAILS:
      '/secretariat-general/session/:sessionId/dossiers/:nominationFileId/observations/:observationId',
    OFFICIAL_REPORT_EDIT:
      '/secretariat-general/session/:sessionId/docs/pv/:officialReportId/validation/edition',
    OFFICIAL_REPORT_NEW: '/secretariat-general/session/:sessionId/docs/pv',
    OFFICIAL_REPORT_PREVIEW: '/secretariat-general/session/:sessionId/docs/pv/:officialReportId/validation',
    OFFICIAL_REPORT_UPDATE: '/secretariat-general/session/:sessionId/docs/pv/:officialReportId',
    PRESENTATIONS_AGENDAS: '/secretariat-general/restitutions/ordres-du-jour',
    PRESENTATIONS_EDIT: '/secretariat-general/restitutions/:planId/validation/edition',
    PRESENTATIONS_NEW: '/secretariat-general/restitutions/nouvelle-notice',
    PRESENTATIONS_PAST: '/secretariat-general/restitutions/restituees',
    PRESENTATIONS_PREVIEW: '/secretariat-general/restitutions/:planId/validation',
    PRESENTATIONS_READY: '/secretariat-general/restitutions/a-restituer',
    PRESENTATIONS_UPDATE: '/secretariat-general/restitutions/:planId',
    SESSION_ID: '/secretariat-general/session/:sessionId',
    SESSION_ID_ATTACHMENTS: '/secretariat-general/session/:sessionId/pieces-jointes',
    SESSION_ID_AUDITIONS: '/secretariat-general/session/:sessionId/auditions',
    SESSION_ID_COMMENT: '/secretariat-general/session/:sessionId/commentaire',
    SESSION_ID_DOCUMENTS: '/secretariat-general/session/:sessionId/documents',
    SESSION_ID_MISSING_EVALUATIONS: '/secretariat-general/session/:sessionId/evaluations-manquantes',
  },
  SUMMARY: '/session/:sessionId/dossier/:fileId/synthese',
  TRANSPARENCES: {
    DASHBOARD: '/transparences',
    DETAILS_REPORTS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/rapports/:id',
    DETAIL_SESSION_GDS: `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId`,
    DETAIL_SESSION_GDS_ATTACHMENTS: `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId/pieces-jointes`,
    DETAIL_SESSION_GDS_AUDITIONS: `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId/auditions`,
    MAGISTRAT_DETAILS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/magistrats/:magistratId',
    OBSERVATION_DETAILS:
      '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId/dossiers/:nominationFileId/observations/:observationId',
  },
  USER_MANUAL: '/aide/manuel',
} as const;

type RoutePath = typeof ROUTE_PATHS;

export type FondationPath<Node = RoutePath> = Node extends string ? Node : FondationPath<Node[keyof Node]>;

export type RoutePathSecretariat = RoutePath['SG'][keyof RoutePath['SG']];

export const getNewAgendaPath = (sessionId: string): string =>
  generatePath(ROUTE_PATHS.SG.AGENDA_NEW, { sessionId });

export function getDetailSessionGdsPath(props: { sessionId: string }): string {
  return generatePath(ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS, { sessionId: props.sessionId });
}

export const getGdsReportPath = (id: string) => {
  return generatePath(ROUTE_PATHS.TRANSPARENCES.DETAILS_REPORTS, { id });
};

export const openedDossierSearch = (nominationFileId: string): string =>
  `?${new URLSearchParams({ [SIDE_PANEL_DOSSIER_PARAM]: nominationFileId })}`;

/** the files list a report was opened from: going back keeps its filters */
export type FromFilesListState = { filesListSearch: string };

function isFromFilesList(state: unknown): state is FromFilesListState {
  return typeof (state as Partial<FromFilesListState> | null)?.filesListSearch === 'string';
}

export const backToFilesListSearch = (state: unknown, nominationFileId: string): string => {
  const params = new URLSearchParams(isFromFilesList(state) ? state.filesListSearch : '');
  params.set(SIDE_PANEL_DOSSIER_PARAM, nominationFileId);
  return `?${params}`;
};

export const getObservationDetailsPath = (props: {
  context: 'sg' | 'membre';
  nominationFileId: string;
  observationId: string;
  sessionId: string;
}) => {
  const { sessionId, nominationFileId, observationId } = props;
  if (props.context === 'membre') {
    return generatePath(ROUTE_PATHS.TRANSPARENCES.OBSERVATION_DETAILS, {
      nominationFileId,
      observationId,
      sessionId,
    });
  }

  return generatePath(ROUTE_PATHS.SG.OBSERVATION_DETAILS, {
    nominationFileId,
    observationId,
    sessionId,
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
