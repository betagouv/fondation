import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { PageStory } from '@/shared/storybook/PageStory';
import { STORY_AUTHORS, STORY_VIEWS, type StoryView } from '@/shared/storybook/story-users';
import { getMagistratDetailsPath, ROUTE_PATHS } from '@/utils/route-path.utils';
import type {
  DetailedMagistratDto,
  ListedMagistratNominationFilesDto,
  ListedMagistratObservationsDto,
  ListedMagistratPhoneNumbersDto,
} from '@api/types';

import { MagistratDetailsPage } from './MagistratDetailsPage';

const MAGISTRAT: DetailedMagistratDto = {
  birthDate: { day: 24, month: 3, year: 1971 },
  careerHistory:
    '- Juge au tribunal judiciaire de Lyon (2008) - Vice-présidente au tribunal judiciaire de Lyon (2014) - Conseillère à la cour d’appel de Lyon (2021)',
  currentPosition: {
    function: { id: 'C', label: 'Conseiller' },
    grade: 'G2',
    id: 1,
    jurisdiction: { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
  },
  externalUrl: 'https://lolfi.example.fr/magistrat/1',
  firstName: 'Nathalie',
  grade: 'G2',
  gradeDate: { day: 16, month: 8, year: 2019 },
  id: 'magistrat-1',
  installationDate: { day: 1, month: 9, year: 2021 },
  lastName: 'Vasseur',
  marriedName: 'Roussel',
  name: 'Mme VASSEUR Nathalie (ép. ROUSSEL)',
  nominationDate: { day: 12, month: 7, year: 2021 },
  professionalEmail: 'nathalie.roussel@justice.gouv.fr',
  status: 'ACTIVE',
  usedName: 'Roussel',
};

const STATUSES = ['ACTIVE', 'INACTIVE'] as const satisfies readonly DetailedMagistratDto['status'][];

type MagistratNominationFile = ListedMagistratNominationFilesDto['items'][number];

const NOMINATION_FILES: MagistratNominationFile[] = [
  {
    auditionDate: { day: 17, month: 11, year: 2026 },
    auditionRequired: true,
    auditionTime: { hours: 14, minutes: 30, seconds: 0 },
    canScheduleAudition: true,
    id: 'dossier-1',
    name: 'VASSEUR Nathalie',
    number: 12,
    outcome: null,
    reporters: [
      { firstName: 'Rachel', id: 'user-1', lastName: 'Bernard' },
      { firstName: 'Antoine', id: 'user-2', lastName: 'Roche' },
    ],
    session: {
      canOpen: true,
      date: { day: 20, month: 2, year: 2026 },
      formation: 'SIEGE',
      id: 'session-1',
      name: 'Transparence annuelle 2026',
      status: 'ONGOING',
    },
    targetedGrade: 'G1',
    targetedPosition: 'Présidente de chambre CA Aix-en-Provence',
  },
  {
    auditionDate: null,
    auditionRequired: false,
    auditionTime: null,
    canScheduleAudition: false,
    id: 'dossier-2',
    name: 'VASSEUR Nathalie',
    number: 4,
    outcome: { comment: null, value: 'VALIDATED' },
    reporters: [{ firstName: 'Marie', id: 'user-3', lastName: 'Lefevre' }],
    session: {
      canOpen: false,
      date: { day: 18, month: 6, year: 2021 },
      formation: 'SIEGE',
      id: 'session-2',
      name: 'Transparence annuelle 2021',
      status: 'ARCHIVED',
    },
    targetedGrade: 'G2',
    targetedPosition: 'Conseillère CA Lyon',
  },
];

const OBSERVATIONS: ListedMagistratObservationsDto['items'] = [
  {
    dateReception: { day: 10, month: 3, year: 2026 },
    id: 'observation-1',
    // the observations a magistrat made, on someone else's proposition
    nominationFile: { ...NOMINATION_FILES[0]!, id: 'dossier-3', name: 'MARTIN Léa', number: 7 },
  },
];

const PHONE_NUMBERS: ListedMagistratPhoneNumbersDto['items'] = [
  {
    date: { day: 2, month: 3, year: 2026 },
    id: 'phone-1',
    label: 'Portable',
    number: '06 12 34 56 78',
    savedBy: STORY_AUTHORS.sg,
    source: 'FONDATION',
  },
  { date: null, number: '04 72 00 00 00', source: 'LOLFI' },
];

function page<T>(items: T[]) {
  return { currentPageIndex: 1, items, totalCount: items.length };
}

const magistratHandlers = [
  http.get('*/api/magistrats/v1/:magistratId/nomination-files', () =>
    HttpResponse.json<ListedMagistratNominationFilesDto>(page(NOMINATION_FILES)),
  ),
  http.get('*/api/magistrats/v1/:magistratId/observations', () =>
    HttpResponse.json<ListedMagistratObservationsDto>(page(OBSERVATIONS)),
  ),
  http.get('*/api/magistrats/v1/:magistratId/phone-numbers', () =>
    HttpResponse.json<ListedMagistratPhoneNumbersDto>({ items: PHONE_NUMBERS }),
  ),
];

const PATHS = {
  member: ROUTE_PATHS.MEMBER.MAGISTRAT_DETAILS,
  sg: ROUTE_PATHS.SG.MAGISTRAT_DETAILS,
} satisfies Record<StoryView, string>;

function MagistratDetailsPageStory(props: { status: DetailedMagistratDto['status']; view: StoryView }) {
  return (
    <PageStory
      location={getMagistratDetailsPath({
        context: props.view === 'sg' ? 'sg' : 'membre',
        magistratId: MAGISTRAT.id,
      })}
      path={PATHS[props.view]}
      view={props.view}
    >
      <MagistratDetailsPage />
    </PageStory>
  );
}

const meta = {
  args: { status: 'ACTIVE', view: 'sg' },
  argTypes: {
    status: { control: 'inline-radio', options: STATUSES },
    view: { control: 'inline-radio', options: STORY_VIEWS },
  },
  beforeEach: ({ args, msw }) => {
    msw.use(
      http.get('*/api/magistrats/v1/:magistratId', () =>
        HttpResponse.json<DetailedMagistratDto>({ ...MAGISTRAT, status: args.status }),
      ),
      ...magistratHandlers,
    );
  },
  component: MagistratDetailsPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Details/Magistrat',
} satisfies Meta<typeof MagistratDetailsPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
