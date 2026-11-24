import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { PageStory } from '@/shared/storybook/PageStory';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type {
  CreatedCallForApplicationsDto,
  FoundCallForApplicationsFormDto,
  ListedCallsForApplicationsDto,
} from '@api/types';

import { OngoingCallsForApplicationsPage, PastCallsForApplicationsPage } from './CallsForApplicationsPage';

type ListedCall = ListedCallsForApplicationsDto['items'][number];

/** a call never changed since its creation */
function created(
  call: Omit<ListedCall, 'comment' | 'history'> & {
    createdAt: string;
    createdBy: ListedCall['history'][number]['by'];
  },
): ListedCall {
  const { createdAt, createdBy, ...listed } = call;
  return {
    ...listed,
    comment: null,
    history: [{ action: 'CREATED', at: createdAt, by: createdBy, fields: [] }],
  };
}

/** the same call, changed since by an agent */
function updated(call: ListedCall, fields: ListedCall['history'][number]['fields']): ListedCall {
  return {
    ...call,
    history: [
      {
        action: 'UPDATED',
        at: '2026-11-22T13:00:00.000Z',
        by: { id: 'user-3', name: 'Paul MARTIN' },
        fields,
      },
      ...call.history,
    ],
  };
}

const CALLS: Record<'ONGOING' | 'PAST', ListedCall[]> = {
  ONGOING: [
    created({
      canChange: true,
      createdOn: { day: 20, month: 11, year: 2026 },
      deadline: null,
      id: 'call-2',
      createdAt: '2026-11-20T09:30:00.000Z',
      createdBy: { id: 'user-2', name: 'Hélène GARNIER' },
      publishedOn: null,
      status: { id: 'UNPUBLISHED', label: 'Non publié' },
      type: { id: 'GENERAL', label: 'Général' },
    }),
    updated(
      created({
        canChange: true,
        createdOn: { day: 3, month: 11, year: 2026 },
        deadline: { day: 15, month: 1, year: 2027 },
        id: 'call-3',
        createdAt: '2026-11-03T10:00:00.000Z',
        createdBy: { id: 'user-2', name: 'Hélène GARNIER' },
        publishedOn: { day: 1, month: 12, year: 2026 },
        status: { id: 'UNPUBLISHED', label: 'Non publié' },
        type: { id: 'GENERAL', label: 'Général' },
      }),
      [
        { id: 'DEADLINE', label: 'la date limite' },
        { id: 'COMMENT', label: 'le commentaire' },
      ],
    ),
  ],
  PAST: [
    created({
      canChange: false,
      createdOn: { day: 2, month: 10, year: 2026 },
      deadline: { day: 15, month: 11, year: 2026 },
      id: 'call-1',
      createdAt: '2026-10-02T14:00:00.000Z',
      createdBy: null,
      publishedOn: { day: 15, month: 10, year: 2026 },
      status: { id: 'PUBLISHED', label: 'Publié' },
      type: { id: 'GENERAL', label: 'Général' },
    }),
  ],
};

const FORM: FoundCallForApplicationsFormDto = {
  commentMaxLength: 50_000,
  dateRange: { max: '2100-12-31', min: '2000-01-01' },
  types: [{ id: 'GENERAL', label: 'Général', scope: 'Vise tous les postes de CA et de TJ' }],
};

function CallsForApplicationsPageStory(props: {
  deadlineRefused: boolean;
  deleteFails: boolean;
  empty: boolean;
  formLoadFails: boolean;
  loadFails: boolean;
  nextPageFails: boolean;
  period: 'ONGOING' | 'PAST';
  saveFails: boolean;
}) {
  const path =
    props.period === 'PAST'
      ? ROUTE_PATHS.SG.CSM.CALLS_FOR_APPLICATIONS_PAST
      : ROUTE_PATHS.SG.CSM.CALLS_FOR_APPLICATIONS_ONGOING;

  return (
    <PageStory key={JSON.stringify(props)} location={path} path={path} view="sg">
      {props.period === 'PAST' ? <PastCallsForApplicationsPage /> : <OngoingCallsForApplicationsPage />}
    </PageStory>
  );
}

/** the answer of a failed creation or update, none when it succeeds */
function saveFailure(args: { deadlineRefused: boolean; saveFails: boolean }) {
  if (args.deadlineRefused)
    return HttpResponse.json(
      { validationError: 'La date limite ne peut pas précéder la date de publication' },
      { status: 400 },
    );
  return args.saveFails ? new HttpResponse(null, { status: 500 }) : null;
}

const meta = {
  args: {
    deadlineRefused: false,
    deleteFails: false,
    empty: false,
    formLoadFails: false,
    loadFails: false,
    nextPageFails: false,
    period: 'ONGOING',
    saveFails: false,
  },
  argTypes: {
    deadlineRefused: {
      control: 'boolean',
      description: "L'enregistrement refuse une date limite antérieure à la date de publication.",
    },
    deleteFails: { control: 'boolean', description: 'La suppression répond par une erreur.' },
    empty: { control: 'boolean', description: "Aucun appel à candidatures n'a été créé." },
    formLoadFails: { control: 'boolean', description: 'Le formulaire de création ne se charge pas.' },
    loadFails: { control: 'boolean', description: 'La liste répond par une erreur.' },
    nextPageFails: {
      control: 'boolean',
      description: 'La première page arrive, la suivante répond par une erreur.',
    },
    period: { control: 'inline-radio', description: "L'onglet ouvert.", options: ['ONGOING', 'PAST'] },
    saveFails: { control: 'boolean', description: 'La création ou la modification répond par une erreur.' },
  },
  beforeEach: ({ args, msw }) => {
    msw.use(
      http.get('*/api/calls-for-applications/v1', ({ request }) => {
        const params = new URL(request.url).searchParams;
        const page = Number(params.get('page'));
        if (args.loadFails || (args.nextPageFails && page > 1))
          return new HttpResponse(null, { status: 500 });

        const years = params.getAll('years');
        const items = args.empty || (years.length > 0 && !years.includes('2026')) ? [] : CALLS[args.period];
        return HttpResponse.json<ListedCallsForApplicationsDto>({
          currentPageIndex: page,
          items,
          nextPageIndex: args.nextPageFails ? page + 1 : undefined,
          statuses: [
            { id: 'UNPUBLISHED', label: 'Non publié' },
            { id: 'PUBLISHED', label: 'Publié' },
          ],
          totalCount: args.nextPageFails ? items.length + 1 : items.length,
          years: [2026, 2025],
        });
      }),
      http.get('*/api/calls-for-applications/v1/form', () =>
        args.formLoadFails
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json<FoundCallForApplicationsFormDto>(FORM),
      ),
      http.post(
        '*/api/calls-for-applications/v1',
        () =>
          saveFailure(args) ??
          HttpResponse.json<CreatedCallForApplicationsDto>({ id: 'call-4' }, { status: 201 }),
      ),
      http.put(
        '*/api/calls-for-applications/v1/:callId',
        () => saveFailure(args) ?? new HttpResponse(null, { status: 204 }),
      ),
      http.delete('*/api/calls-for-applications/v1/:callId', () =>
        args.deleteFails ? new HttpResponse(null, { status: 500 }) : new HttpResponse(null, { status: 204 }),
      ),
    );
  },
  component: CallsForApplicationsPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/CallsForApplications',
} satisfies Meta<typeof CallsForApplicationsPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
