import { generatePath, redirect } from 'react-router';

export const SIDE_PANEL_DOSSIER_PARAM = 'dossier';

export const ROUTE_PATHS = {
  ACCESSIBILITY: '/accessibilite',
  ACCOUNT: '/mon-compte',
  ADMIN: {
    API_CLIENTS: '/admin/clients-api',
    DETAILS_JOB: '/admin/ingestions/:jobId',
    FEEDBACKS: '/admin/retours',
    FEEDBACKS_STATUS: '/admin/retours/:status',
    HELP: '/admin/aide',
    INGEST_LOLFI: '/admin/lolfi',
    LIST_JOBS: '/admin/ingestions',
    ROOT: '/admin',
    SURVEYS: '/admin/avis',
    USERS: '/admin/utilisateurs',
    USER_DETAIL: '/admin/utilisateurs/:userId',
  },
  HELP: '/aide',
  LOGIN: '/login',
  MEMBER: {
    MAGISTRAT_DETAILS: '/magistrats/:magistratId',
    MAGISTRAT_SEARCH: '/magistrats',
  },
  REDIRECT_MAGISTRAT_LOLFI: '/session/:sessionId/dossier/:fileId/lolfi-magistrat',
  SG: {
    CSM: {
      CALLS_FOR_APPLICATIONS: '/secretariat-general/csm/appels-a-candidature',
      CALLS_FOR_APPLICATIONS_ONGOING: '/secretariat-general/csm/appels-a-candidature/en-cours',
      CALLS_FOR_APPLICATIONS_PAST: '/secretariat-general/csm/appels-a-candidature/passes',
      ROOT: '/secretariat-general/csm',
      SELECTION_PROCESS: '/secretariat-general/csm/processus-de-selection',
      VEILLE_DES_POSTES: '/secretariat-general/csm/veille-des-postes',
      VEILLE_DES_POSTES_COURTS_OF_APPEAL: '/secretariat-general/csm/veille-des-postes/cours-d-appel',
      VEILLE_DES_POSTES_COURT_OF_CASSATION: '/secretariat-general/csm/veille-des-postes/cour-de-cassation',
      VEILLE_DES_POSTES_COURT_OF_CASSATION_POSITION:
        '/secretariat-general/csm/veille-des-postes/cour-de-cassation/:position',
      VEILLE_DES_POSTES_JUDICIAL_COURTS: '/secretariat-general/csm/veille-des-postes/tribunaux-judiciaires',
    },
    DASHBOARD: '/secretariat-general',
    GDS: {
      AGENDA_EDIT:
        '/secretariat-general/gds/session/:sessionId/docs/ordre-du-jour/:agendaId/validation/edition',
      AGENDA_NEW: '/secretariat-general/gds/session/:sessionId/docs/ordre-du-jour',
      AGENDA_PREVIEW: '/secretariat-general/gds/session/:sessionId/docs/ordre-du-jour/:agendaId/validation',
      AGENDA_UPDATE_FILES:
        '/secretariat-general/gds/session/:sessionId/docs/ordre-du-jour/:agendaId/dossiers',
      AGENDA_UPDATE_METADATA:
        '/secretariat-general/gds/session/:sessionId/docs/ordre-du-jour/:agendaId/metadonnees',
      ARCHIVED_SESSIONS: '/secretariat-general/gds/archives/sessions',
      FOLLOWED_UP_OBSERVATIONS: '/secretariat-general/gds/suivi-des-observations',
      MANAGE_SESSION: '/secretariat-general/gds/sessions',
      OBSERVATION_DETAILS:
        '/secretariat-general/gds/session/:sessionId/dossiers/:nominationFileId/observations/:observationId',
      OFFICIAL_REPORT_EDIT:
        '/secretariat-general/gds/session/:sessionId/docs/pv/:officialReportId/validation/edition',
      OFFICIAL_REPORT_NEW: '/secretariat-general/gds/session/:sessionId/docs/pv',
      OFFICIAL_REPORT_PREVIEW:
        '/secretariat-general/gds/session/:sessionId/docs/pv/:officialReportId/validation',
      OFFICIAL_REPORT_UPDATE: '/secretariat-general/gds/session/:sessionId/docs/pv/:officialReportId',
      PRESENTATIONS_AGENDAS: '/secretariat-general/gds/restitutions/ordres-du-jour',
      PRESENTATIONS_EDIT: '/secretariat-general/gds/restitutions/:planId/validation/edition',
      PRESENTATIONS_NEW: '/secretariat-general/gds/restitutions/nouvelle-notice',
      PRESENTATIONS_PAST: '/secretariat-general/gds/restitutions/restituees',
      PRESENTATIONS_PREVIEW: '/secretariat-general/gds/restitutions/:planId/validation',
      PRESENTATIONS_READY: '/secretariat-general/gds/restitutions/a-restituer',
      PRESENTATIONS_UPDATE: '/secretariat-general/gds/restitutions/:planId',
      ROOT: '/secretariat-general/gds',
      SESSION_ID: '/secretariat-general/gds/session/:sessionId',
      SESSION_ID_ATTACHMENTS: '/secretariat-general/gds/session/:sessionId/pieces-jointes',
      SESSION_ID_AUDITIONS: '/secretariat-general/gds/session/:sessionId/auditions',
      SESSION_ID_COMMENT: '/secretariat-general/gds/session/:sessionId/commentaire',
      SESSION_ID_DOCUMENTS: '/secretariat-general/gds/session/:sessionId/documents',
      SESSION_ID_MISSING_EVALUATIONS: '/secretariat-general/gds/session/:sessionId/evaluations-manquantes',
      SESSION_ID_OBSERVATIONS: '/secretariat-general/gds/session/:sessionId/observations',
    },
    MAGISTRAT_DETAILS: '/secretariat-general/magistrats/:magistratId',
    MAGISTRAT_SEARCH: '/secretariat-general/magistrats',
    MANAGE_MEMBERS: '/secretariat-general/membres',
    MANAGE_SINGLE_MEMBER: '/secretariat-general/membres/:userId',
  },
  SUMMARY: '/session/:sessionId/dossier/:fileId/synthese',
  SURVEY: '/avis',
  TRANSPARENCES: {
    ARCHIVED_SESSIONS: '/transparences/archives/sessions',
    DASHBOARD: '/transparences',
    DETAILS_REPORTS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/rapports/:id',
    DETAIL_SESSION_GDS: `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId`,
    DETAIL_SESSION_GDS_ATTACHMENTS: `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId/pieces-jointes`,
    DETAIL_SESSION_GDS_AUDITIONS: `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId/auditions`,
    MAGISTRAT_DETAILS: '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/magistrats/:magistratId',
    OBSERVATION_DETAILS:
      '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId/dossiers/:nominationFileId/observations/:observationId',
  },
} as const;

/** the spaces a GDS session is read from: the secretariat's and the members' */
export const SESSION_SPACES = {
  SG: { archivedSessions: ROUTE_PATHS.SG.GDS.ARCHIVED_SESSIONS, session: ROUTE_PATHS.SG.GDS.SESSION_ID },
  TRANSPARENCES: {
    archivedSessions: ROUTE_PATHS.TRANSPARENCES.ARCHIVED_SESSIONS,
    session: ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS,
  },
} as const;
export type SessionSpace = keyof typeof SESSION_SPACES;

type RoutePath = typeof ROUTE_PATHS;

export type FondationPath<Node = RoutePath> = Node extends string ? Node : FondationPath<Node[keyof Node]>;

export const getNewAgendaPath = (sessionId: string): string =>
  generatePath(ROUTE_PATHS.SG.GDS.AGENDA_NEW, { sessionId });

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
  const { nominationFileId, observationId, sessionId } = props;
  if (props.context === 'membre') {
    return generatePath(ROUTE_PATHS.TRANSPARENCES.OBSERVATION_DETAILS, {
      nominationFileId,
      observationId,
      sessionId,
    });
  }

  return generatePath(ROUTE_PATHS.SG.GDS.OBSERVATION_DETAILS, {
    nominationFileId,
    observationId,
    sessionId,
  });
};

// TODO: remove once the old member URL has faded from bookmarks and shared links
export const redirectToMemberMagistratDetails = ({ params }: { params: { magistratId?: string } }) =>
  redirect(getMagistratDetailsPath({ context: 'membre', magistratId: params.magistratId ?? '' }));

export const getMagistratDetailsPath = (props: { context: 'sg' | 'membre'; magistratId: string }) => {
  if (props.context === 'membre') {
    return generatePath(ROUTE_PATHS.MEMBER.MAGISTRAT_DETAILS, { magistratId: props.magistratId });
  }

  return generatePath(ROUTE_PATHS.SG.MAGISTRAT_DETAILS, { magistratId: props.magistratId });
};

/**
 * the GDS pages lived right under the secretariat's space before the home offered both pouvoirs de proposition
 * TODO: remove once these URLs have faded from bookmarks and mails
 */
export const LEGACY_GDS_PATHS = [
  '/secretariat-general/archives/*',
  '/secretariat-general/restitutions/*',
  '/secretariat-general/session/*',
  '/secretariat-general/sessions',
  '/secretariat-general/suivi-des-observations',
] as const;

export const redirectToGdsPath = ({ request }: { request: Request }) => {
  const { pathname, search } = new URL(request.url);
  return redirect(`${ROUTE_PATHS.SG.GDS.ROOT}${pathname.slice(ROUTE_PATHS.SG.DASHBOARD.length)}${search}`);
};

/**
 * the members' pages lived under the GDS before both pouvoirs de proposition shared them
 * TODO: remove once these URLs have faded from bookmarks
 */
export const LEGACY_GDS_MEMBERS_PATH = '/secretariat-general/gds/membres/*';

export const redirectFromGdsPath = ({ request }: { request: Request }) => {
  const { pathname, search } = new URL(request.url);
  return redirect(`${ROUTE_PATHS.SG.DASHBOARD}${pathname.slice(ROUTE_PATHS.SG.GDS.ROOT.length)}${search}`);
};
