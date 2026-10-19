import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { PageStory } from '@/shared/storybook/PageStory';
import { STORY_SESSION } from '@/shared/storybook/story-session';
import { STORY_AUTHORS, STORY_USERS, STORY_VIEWS, type StoryView } from '@/shared/storybook/story-users';
import { getGdsReportPath, ROUTE_PATHS } from '@/utils/route-path.utils';
import type {
  DetailedNominationFileDto,
  DetailedNominationSessionDto,
  DetailedReportDto,
  ListedMemberSessionReportsDto,
} from '@api/types';

import { ReportOverviewPage } from './ReportOverviewPage';

const REPORT: DetailedReportDto = {
  attachments: [
    {
      addedAt: '2026-03-02T09:15:00.000Z',
      addedBy: STORY_AUTHORS.member,
      fileId: 'file-1',
      name: 'notes-entretien.pdf',
      size: 84_210,
      usage: 'ATTACHMENT',
    },
  ],
  comment:
    '<p>Magistrate au parcours confirmé, appréciée de ses chefs de juridiction.</p><h2>Points d’attention</h2><p>Mobilité géographique à confirmer.</p>',
  id: 'report-2',
  nominationFileId: 'nomination-file-2',
  screenshots: [],
  sessionId: STORY_SESSION.id,
  state: 'IN_PROGRESS',
};

const NOMINATION_FILE: DetailedNominationFileDto = {
  auditionDate: { day: 15, month: 10, year: 2026 },
  auditionRequired: true,
  auditionRequirement: 'POSITION',
  auditionTime: { hours: 14, minutes: 30, seconds: 0 },
  canScheduleAudition: true,
  comment: null,
  content: {
    dateDeNaissance: { day: 12, month: 4, year: 1978 },
    dateEchéance: null,
    datePassageAuGrade: { day: 1, month: 9, year: 2018 },
    datePriseDeFonctionPosteActuel: { day: 1, month: 9, year: 2021 },
    detectedMagistratId: 'magistrat-1',
    grade: 'I',
    gradeCible: 'HH',
    historique:
      '- Juge au tribunal judiciaire de Lyon (2008) - Vice-présidente au tribunal judiciaire de Lyon (2014) - Conseillère à la cour d’appel de Lyon (2021)',
    informationCarrière: null,
    isAlertHidden: false,
    jurisdictions: { current: null, targeted: null },
    lockedReason: null,
    nomMagistrat: 'DURAND Camille',
    numeroDeDossier: 12,
    observants: null,
    outcome: null,
    posteActuel: 'Conseillère à la cour d’appel de Lyon',
    posteCible: 'Présidente de chambre à la cour d’appel de Paris',
    rang: '12 sur 45',
    status: { dates: [], value: 'TO_REPORT' },
    version: 2,
  },
  expectedReportersCount: 2,
  hasAttachment: false,
  hasJurisdictionSheet: false,
  id: REPORT.nominationFileId,
  isArchived: false,
  memo: null,
  missingEvaluation: false,
  missingEvaluationComment: null,
  observations: [],
  priorities: ['ETOILE'],
  reporters: [{ firstName: 'Jean', id: STORY_USERS.member.id, lastName: 'Petit' }],
  summary: null,
};

const MEMBER_REPORTS: ListedMemberSessionReportsDto = {
  items: [
    {
      name: 'MARTIN Léa',
      nominationFileId: 'nomination-file-1',
      number: 11,
      report: { id: 'report-1', state: 'SUPPORTED' },
    },
    {
      name: 'DURAND Camille',
      nominationFileId: REPORT.nominationFileId,
      number: 12,
      report: { id: REPORT.id, state: REPORT.state },
    },
    {
      name: 'PETIT Hugo',
      nominationFileId: 'nomination-file-3',
      number: 13,
      report: { id: 'report-3', state: 'NEW' },
    },
  ],
};

function ReportOverviewPageStory(props: { view: StoryView }) {
  return (
    <PageStory
      location={getGdsReportPath(REPORT.id)}
      path={ROUTE_PATHS.TRANSPARENCES.DETAILS_REPORTS}
      view={props.view}
    >
      <ReportOverviewPage />
    </PageStory>
  );
}

const meta = {
  args: { view: 'member' },
  argTypes: { view: { control: 'inline-radio', options: STORY_VIEWS } },
  beforeEach: ({ msw }) => {
    msw.use(
      http.get('*/api/reports/v2/:reportId', () => HttpResponse.json<DetailedReportDto>(REPORT)),
      http.get('*/api/sessions/v2/:sessionId', () =>
        HttpResponse.json<DetailedNominationSessionDto>(STORY_SESSION),
      ),
      http.get('*/api/sessions/v2/:sessionId/files/:nominationFileId', () =>
        HttpResponse.json<DetailedNominationFileDto>(NOMINATION_FILE),
      ),
      http.get(
        '*/api/members/v1/:userId/sessions/transparence/garde-des-sceaux/:sessionId/reports',
        ({ params }) =>
          HttpResponse.json<ListedMemberSessionReportsDto>(
            params.userId === STORY_USERS.member.id ? MEMBER_REPORTS : { items: [] },
          ),
      ),
    );
  },
  component: ReportOverviewPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Details/Report',
} satisfies Meta<typeof ReportOverviewPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
