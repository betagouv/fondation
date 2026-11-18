import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { FEEDBACK_STATUSES, type FeedbackStatusEnum } from '@/shared/enums/feedback-status.enum';
import { PageStory } from '@/shared/storybook/PageStory';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { ListedFeedbacksDto } from '@api/types';

import { AdminFeedbacksPage } from './AdminFeedbacksPage';
import { feedbackStatusPath } from './feedback-status-paths';

type ListedFeedback = ListedFeedbacksDto['items'][number];

const AUTHOR = { id: 'user-2', name: 'Hélène GARNIER' };
const ADMIN = { id: 'admin-1', name: 'Claire MARTIN' };

function feedbackOf(id: string, text: string, status: ListedFeedback['status']): ListedFeedback {
  return {
    author: AUTHOR,
    id,
    impersonated: null,
    openAs: AUTHOR,
    sentAt: '2026-11-12T09:30:00.000Z',
    status,
    text,
    url: '/transparences',
  };
}

const NEW_STATUS = { changedAt: null, changedBy: null, comment: null, value: 'NEW' } as const;

const FEEDBACKS: Record<FeedbackStatusEnum, ListedFeedback[]> = {
  ACKNOWLEDGED: [
    feedbackOf('feedback-3', 'Pourrait-on trier les dossiers par date de réception ?', {
      changedAt: '2026-11-14T10:00:00.000Z',
      changedBy: ADMIN,
      comment: 'FON-790',
      value: 'ACKNOWLEDGED',
    }),
  ],
  DISMISSED: [
    feedbackOf('feedback-5', 'Test, à ignorer.', {
      changedAt: '2026-11-13T08:00:00.000Z',
      changedBy: ADMIN,
      comment: 'Hors périmètre',
      value: 'DISMISSED',
    }),
  ],
  NEW: [
    feedbackOf('feedback-1', "Le bouton d'export ne réagit pas sur la page des transparences.", NEW_STATUS),
    feedbackOf('feedback-2', 'Le PDF du procès-verbal coupe la dernière ligne du tableau.', NEW_STATUS),
  ],
  PROCESSED: [
    feedbackOf('feedback-4', 'La recherche par nom ne trouve pas les noms composés.', {
      changedAt: '2026-11-15T16:00:00.000Z',
      changedBy: ADMIN,
      comment: 'Corrigé en production le 15/11',
      value: 'PROCESSED',
    }),
  ],
};

function AdminFeedbacksPageStory(props: {
  loadFails: boolean;
  nextPageFails: boolean;
  status: FeedbackStatusEnum;
}) {
  return (
    <PageStory
      location={feedbackStatusPath(props.status)}
      path={ROUTE_PATHS.ADMIN.FEEDBACKS_STATUS}
      view="sg"
    >
      <AdminFeedbacksPage />
    </PageStory>
  );
}

const meta = {
  args: { loadFails: false, nextPageFails: false, status: 'NEW' },
  argTypes: {
    loadFails: { control: 'boolean', description: "L'API répond par une erreur." },
    nextPageFails: {
      control: 'boolean',
      description: 'La première page arrive, la suivante répond par une erreur.',
    },
    status: { control: 'inline-radio', options: FEEDBACK_STATUSES },
  },
  beforeEach: ({ args, msw }) => {
    msw.use(
      http.get('*/api/feedbacks/v1', ({ request }) => {
        const params = new URL(request.url).searchParams;
        const page = Number(params.get('page'));
        if (args.loadFails || (args.nextPageFails && page > 1))
          return new HttpResponse(null, { status: 500 });

        const items = FEEDBACKS[params.get('statuses') as FeedbackStatusEnum];
        return HttpResponse.json<ListedFeedbacksDto>({
          currentPageIndex: page,
          items,
          nextPageIndex: args.nextPageFails ? page + 1 : undefined,
          statuses: FEEDBACK_STATUSES.map((id) => ({ count: FEEDBACKS[id].length, id })),
          totalCount: args.nextPageFails ? items.length + 1 : items.length,
        });
      }),
    );
  },
  component: AdminFeedbacksPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Feedbacks',
} satisfies Meta<typeof AdminFeedbacksPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
