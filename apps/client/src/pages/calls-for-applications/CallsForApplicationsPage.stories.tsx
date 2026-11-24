import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { PageStory } from '@/shared/storybook/PageStory';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type {
  CreatedCallForApplicationsDto,
  FoundCallForApplicationsFormDto,
  ListedCallsForApplicationsDto,
} from '@api/types';

import { CallsForApplicationsPage } from './CallsForApplicationsPage';

const CALLS: ListedCallsForApplicationsDto['items'] = [
  {
    createdOn: { day: 20, month: 11, year: 2026 },
    deadline: null,
    id: 'call-2',
    lastChange: { at: '2026-11-20T09:30:00.000Z', by: { id: 'user-2', name: 'Hélène GARNIER' } },
    publishedOn: null,
    status: { id: 'UNPUBLISHED', label: 'Non publié' },
    targetJurisdictionType: { id: 'COURT_OF_APPEAL', label: 'CA' },
    type: { id: 'GENERAL', label: 'Général' },
  },
  {
    createdOn: { day: 2, month: 10, year: 2026 },
    deadline: { day: 15, month: 11, year: 2026 },
    id: 'call-1',
    lastChange: { at: '2026-10-02T14:00:00.000Z', by: null },
    publishedOn: { day: 15, month: 10, year: 2026 },
    status: { id: 'PUBLISHED', label: 'Publié' },
    targetJurisdictionType: { id: 'JUDICIAL_COURT', label: 'TJ' },
    type: { id: 'GENERAL', label: 'Général' },
  },
];

const FORM: FoundCallForApplicationsFormDto = {
  commentMaxLength: 50_000,
  dateRange: { max: '2100-12-31', min: '2000-01-01' },
  targetJurisdictionTypes: [
    { id: 'COURT_OF_APPEAL', label: 'CA' },
    { id: 'JUDICIAL_COURT', label: 'TJ' },
  ],
  types: [{ id: 'GENERAL', label: 'Général' }],
};

function CallsForApplicationsPageStory(props: {
  createFails: boolean;
  deadlineRefused: boolean;
  empty: boolean;
  formLoadFails: boolean;
  loadFails: boolean;
  nextPageFails: boolean;
}) {
  return (
    <PageStory
      key={JSON.stringify(props)}
      location={ROUTE_PATHS.SG.CSM.CALLS_FOR_APPLICATIONS}
      path={ROUTE_PATHS.SG.CSM.CALLS_FOR_APPLICATIONS}
      view="sg"
    >
      <CallsForApplicationsPage />
    </PageStory>
  );
}

const meta = {
  args: {
    createFails: false,
    deadlineRefused: false,
    empty: false,
    formLoadFails: false,
    loadFails: false,
    nextPageFails: false,
  },
  argTypes: {
    createFails: { control: 'boolean', description: 'La création répond par une erreur.' },
    deadlineRefused: {
      control: 'boolean',
      description: 'La création refuse une date limite antérieure à la date de publication.',
    },
    empty: { control: 'boolean', description: "Aucun appel à candidatures n'a été créé." },
    formLoadFails: { control: 'boolean', description: 'Le formulaire de création ne se charge pas.' },
    loadFails: { control: 'boolean', description: 'La liste répond par une erreur.' },
    nextPageFails: {
      control: 'boolean',
      description: 'La première page arrive, la suivante répond par une erreur.',
    },
  },
  beforeEach: ({ args, msw }) => {
    msw.use(
      http.get('*/api/calls-for-applications/v1', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        if (args.loadFails || (args.nextPageFails && page > 1))
          return new HttpResponse(null, { status: 500 });

        const items = args.empty ? [] : CALLS;
        return HttpResponse.json<ListedCallsForApplicationsDto>({
          currentPageIndex: page,
          items,
          nextPageIndex: args.nextPageFails ? page + 1 : undefined,
          totalCount: args.nextPageFails ? items.length + 1 : items.length,
        });
      }),
      http.get('*/api/calls-for-applications/v1/form', () =>
        args.formLoadFails
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json<FoundCallForApplicationsFormDto>(FORM),
      ),
      http.post('*/api/calls-for-applications/v1', () =>
        args.deadlineRefused
          ? HttpResponse.json(
              { validationError: 'La date limite ne peut pas précéder la date de publication' },
              { status: 400 },
            )
          : args.createFails
            ? new HttpResponse(null, { status: 500 })
            : HttpResponse.json<CreatedCallForApplicationsDto>({ id: 'call-3' }, { status: 201 }),
      ),
    );
  },
  component: CallsForApplicationsPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/CallsForApplications',
} satisfies Meta<typeof CallsForApplicationsPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
