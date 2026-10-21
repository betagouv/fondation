import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { generatePath } from 'react-router';

import { PageStory } from '@/shared/storybook/PageStory';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedMemberDto } from '@api/types';

import { DetailsMemberPage } from './DetailsMemberPage';

const MEMBER: DetailedMemberDto = {
  displayTitle: 'Mme la conseillère',
  email: 'helene.garnier@csm.justice.fr',
  excludedJurisdictions: [
    { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
    { id: 'TJ  VILLEFRANCHE SUR SAONE', label: 'Tribunal judiciaire de Villefranche-sur-Saône' },
  ],
  firstName: 'Hélène',
  gender: 'FEMALE',
  id: 'member-2',
  lastName: 'Garnier',
  role: 'MEMBRE_DU_SIEGE',
  stats: [
    { count: 4, targetedGrade: 'I', year: 2026 },
    { count: 7, targetedGrade: 'HH', year: 2026 },
    { count: 3, targetedGrade: 'I', year: 2025 },
  ],
};

function DetailsMemberPageStory() {
  return (
    <PageStory
      location={generatePath(ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER, { userId: MEMBER.id })}
      path={ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER}
      view="sg"
    >
      <DetailsMemberPage />
    </PageStory>
  );
}

const meta = {
  beforeEach: ({ msw }) => {
    msw.use(http.get('*/api/members/v1/:userId', () => HttpResponse.json<DetailedMemberDto>(MEMBER)));
  },
  component: DetailsMemberPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Details/Member',
} satisfies Meta<typeof DetailsMemberPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
