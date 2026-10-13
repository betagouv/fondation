import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import type { SearchMagistratsResponseDto } from '@api/types';

import { MagistratSearch } from './MagistratSearch';

const PAGE_SIZE = 20;

const MAGISTRATS: SearchMagistratsResponseDto['items'] = Array.from({ length: 45 }, (_, index) => ({
  currentPosition: {
    function: { id: 'J', label: 'Juge' },
    jurisdiction: { id: 'TJ LYON', label: 'Tribunal judiciaire de Lyon' },
  },
  firstName: `CLAIRE ${index + 1}`,
  grade: 'G2',
  id: `magistrat-${index + 1}`,
  lastName: 'MARTIN',
  name: `MARTIN Claire ${index + 1}`,
}));

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

const meta = {
  args: { context: 'sg' },
  beforeEach: ({ msw }) => {
    msw.use(searchHandler);
  },
  component: MagistratSearch,
  decorators: [
    (Story, context) => (
      <NuqsTestingAdapter hasMemory searchParams={context.parameters.searchParams as string | undefined}>
        <StoryQueryClient>
          <Story />
        </StoryQueryClient>
      </NuqsTestingAdapter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Écran « Rechercher un magistrat » : la saisie vit dans l'URL (`?recherche=`), 20 cartes s'affichent puis « Voir plus » en ajoute 20 tant qu'il reste des résultats.",
      },
    },
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Features/MagistratSearch/Screen',
} satisfies Meta<typeof MagistratSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Invitation: Story = {};

export const WithMoreResults: Story = {
  parameters: { searchParams: '?recherche=martin' },
};

export const WithoutResult: Story = {
  parameters: { searchParams: '?recherche=durand' },
};
