import type { Meta, StoryObj } from '@storybook/react-vite';
import { FEMALE_FIRST_NAMES, LAST_NAMES, MALE_FIRST_NAMES } from 'lolfi/fictitious-archive/names';
import FUNCTIONS from 'lolfi/fictitious-archive/referential/functions.json';
import JURISDICTIONS from 'lolfi/fictitious-archive/referential/jurisdictions.json';
import { http, HttpResponse } from 'msw';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

import { PageStory } from '@/shared/storybook/PageStory';
import { STORY_VIEWS, type StoryView } from '@/shared/storybook/story-users';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { SearchMagistratsResponseDto } from '@api/types';
import type { FoundMagistrat } from '@queries/magistrats.queries';

import { MagistratSearchPage } from './MagistratSearchPage';

const PAGE_SIZE = 20;

// the cases the card tells apart
const SINGULAR_MAGISTRATS: FoundMagistrat[] = [
  {
    currentPosition: {
      function: { id: 'SGCSG', label: "Substitut général chargé d'un secrétariat général" },
      jurisdiction: { id: 'TJ  ORLEANS', label: "Tribunal judiciaire d'Orléans" },
    },
    firstName: 'JEAN',
    grade: 'G1',
    gradeAndJurisdiction: 'G1 - TJ ORLEANS',
    id: 'magistrat-bernard-jean',
    lastName: 'BERNARD',
    name: 'BERNARD Jean',
    status: 'ACTIVE',
    usedName: null,
  },
  {
    currentPosition: {
      function: { id: 'J', label: 'Juge' },
      jurisdiction: { id: 'TJ  LYON', label: 'Tribunal judiciaire de Lyon' },
    },
    firstName: 'ISABELLE',
    grade: 'G2',
    gradeAndJurisdiction: 'G2 - TJ LYON',
    id: 'magistrat-bernard-isabelle',
    lastName: 'BERNARD',
    name: 'BERNARD Isabelle (ép. ROBERT)',
    status: 'ACTIVE',
    usedName: 'BERNARD-ROBERT',
  },
  {
    currentPosition: {
      function: null,
      jurisdiction: { id: 'TJ  RODEZ', label: 'Tribunal judiciaire de Rodez' },
    },
    firstName: 'PAUL',
    grade: 'G1',
    gradeAndJurisdiction: 'G1 - TJ RODEZ',
    id: 'magistrat-bernard-paul',
    lastName: 'BERNARD',
    name: 'BERNARD Paul',
    status: 'ACTIVE',
    usedName: null,
  },
  {
    currentPosition: null,
    firstName: 'LÉA',
    grade: null,
    gradeAndJurisdiction: null,
    id: 'magistrat-bernard-lea',
    lastName: 'BERNARD',
    name: 'BERNARD Léa',
    status: 'INACTIVE',
    usedName: null,
  },
];

// fictitious names on the real functions and courts, from the fictitious LOLFI archive
const COURTS = JURISDICTIONS.filter(({ jurisdictionType }) => ['CA', 'TJ'].includes(jurisdictionType));
const GRADES = ['G1', 'G2', 'G3'] as const;

function fictitiousMagistrat(index: number, lastName: string): FoundMagistrat {
  const firstNames = index % 3 === 0 ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
  const firstName = firstNames[(index * 7) % firstNames.length]!;
  const jurisdiction = COURTS[(index * 13) % COURTS.length]!;
  const position = FUNCTIONS[(index * 5) % FUNCTIONS.length]!;
  const grade = GRADES[index % GRADES.length]!;

  return {
    currentPosition: {
      function: { id: position.id, label: position.label },
      jurisdiction: { id: jurisdiction.id, label: jurisdiction.label },
    },
    firstName: firstName.toUpperCase(),
    grade,
    gradeAndJurisdiction: `${grade} - ${jurisdiction.id.replace(/\s+/g, ' ')}`,
    id: `magistrat-${index}`,
    lastName,
    name: `${lastName} ${firstName}`,
    status: index % 7 === 6 ? 'INACTIVE' : 'ACTIVE',
    usedName: null,
  };
}

// enough BERNARD for two pages of results, among other names
const MAGISTRATS: FoundMagistrat[] = [
  ...SINGULAR_MAGISTRATS,
  ...Array.from({ length: 21 }, (_, index) => fictitiousMagistrat(index, 'BERNARD')),
  ...Array.from({ length: 20 }, (_, index) =>
    fictitiousMagistrat(21 + index, LAST_NAMES[(index * 11) % LAST_NAMES.length]!),
  ),
];

const searchHandler = http.get('*/api/magistrats/v1', ({ request }) => {
  const query = new URL(request.url).searchParams;
  const search = query.get('search')?.toUpperCase() ?? '';
  const page = Number(query.get('page') ?? 1);
  const found = MAGISTRATS.filter((magistrat) => magistrat.name.toUpperCase().includes(search));
  const hasNextPage = page * PAGE_SIZE < found.length;

  return HttpResponse.json<SearchMagistratsResponseDto>({
    currentPageIndex: page,
    items: found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    nextPageIndex: hasNextPage ? page + 1 : undefined,
    totalCount: found.length,
  });
});

const PATHS = {
  member: ROUTE_PATHS.MEMBER.MAGISTRAT_SEARCH,
  sg: ROUTE_PATHS.SG.MAGISTRAT_SEARCH,
} satisfies Record<StoryView, string>;

function MagistratSearchPageStory(props: { search: string; view: StoryView }) {
  return (
    <PageStory location={PATHS[props.view]} path={PATHS[props.view]} view={props.view}>
      <NuqsTestingAdapter hasMemory key={props.search} searchParams={{ recherche: props.search }}>
        <MagistratSearchPage />
      </NuqsTestingAdapter>
    </PageStory>
  );
}

const meta = {
  args: { search: '', view: 'sg' },
  argTypes: {
    search: { control: 'text', description: 'bernard finds two pages, zzz finds nothing' },
    view: { control: 'inline-radio', options: STORY_VIEWS },
  },
  beforeEach: ({ msw }) => {
    msw.use(searchHandler);
  },
  component: MagistratSearchPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/MagistratSearch',
} satisfies Meta<typeof MagistratSearchPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
