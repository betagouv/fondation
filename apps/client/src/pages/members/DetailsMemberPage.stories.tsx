import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { generatePath } from 'react-router';

import { PageStory } from '@/shared/storybook/PageStory';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedMemberDto, SearchMagistratsResponseDto } from '@api/types';

import { DetailsMemberPage } from './DetailsMemberPage';

const MEMBER: DetailedMemberDto = {
  displayTitle: 'Mme la conseillère',
  email: 'helene.garnier@csm.justice.fr',
  excludedJurisdictions: [
    { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
    { id: 'TJ  VILLEFRANCHE SUR SAONE', label: 'Tribunal judiciaire de Villefranche-sur-Saône' },
  ],
  excludedMagistrats: [
    {
      currentPosition: {
        function: { id: 'JUGE', label: 'Juge' },
        jurisdiction: { id: 'TJ  LYON', label: 'Tribunal judiciaire de Lyon' },
      },
      grade: 'I',
      id: 'magistrat-1',
      name: 'DURAND Claire',
      status: 'ACTIVE',
    },
    { currentPosition: null, grade: 'HH', id: 'magistrat-2', name: 'MARTIN Paul', status: 'INACTIVE' },
  ],
  firstName: 'Hélène',
  formation: { id: 'SIEGE', label: 'Siège' },
  gender: 'FEMALE',
  id: 'member-2',
  lastName: 'Garnier',
  recusalTitle: 'la Première présidente',
  stats: [
    { count: 4, targetedGrade: 'I', year: 2026 },
    { count: 7, targetedGrade: 'HH', year: 2026 },
    { count: 3, targetedGrade: 'I', year: 2025 },
  ],
};

const RESPONSES = [200, 404] as const;

function DetailsMemberPageStory(props: { response: (typeof RESPONSES)[number] }) {
  return (
    <PageStory
      // a new response needs a new fetch: the query cache lives in PageStory
      key={props.response}
      location={generatePath(ROUTE_PATHS.SG.GDS.MANAGE_SINGLE_MEMBER, { userId: MEMBER.id })}
      path={ROUTE_PATHS.SG.GDS.MANAGE_SINGLE_MEMBER}
      view="sg"
    >
      <DetailsMemberPage />
    </PageStory>
  );
}

const meta = {
  args: { response: 200 },
  argTypes: { response: { control: 'inline-radio', options: RESPONSES } },
  beforeEach: ({ args, msw }) => {
    msw.use(
      http.get('*/api/members/v1/:userId', () =>
        args.response === 404
          ? new HttpResponse(null, { status: 404 })
          : HttpResponse.json<DetailedMemberDto>(MEMBER),
      ),
      http.get('*/api/magistrats/v1', () =>
        HttpResponse.json<SearchMagistratsResponseDto>({
          currentPageIndex: 1,
          items: [
            {
              currentPosition: {
                function: { id: 'SUBSTITUT', label: 'Substitut du procureur' },
                jurisdiction: { id: 'TJ  RENNES', label: 'Tribunal judiciaire de Rennes' },
              },
              firstName: 'Louise',
              grade: 'II',
              gradeAndJurisdiction: 'II - TJ RENNES',
              id: 'magistrat-3',
              lastName: 'DUPONT',
              name: 'DUPONT Louise',
              status: 'ACTIVE',
              usedName: null,
            },
          ],
          totalCount: 1,
        }),
      ),
    );
  },
  component: DetailsMemberPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Details/Member',
} satisfies Meta<typeof DetailsMemberPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
