import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { ObservationsModalProvider } from '../../../observations/context/ObservationsModalProvider';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { ObservationFollowUpEnumLabels, type ObservationFollowupEnum } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type {
  CreateObservationResponseDto,
  ListedObservationsAttachmentsDto,
  ListObservationsResponseDto,
  SearchMagistratsResponseDto,
  UpdateObservationDto,
} from '@api/types';
import type { Observation } from '@queries/observations.queries';

import { Observations } from './Observations';

const SESSION_ID = 'session-1';

const OBSERVERS = [
  'Syndicat de la magistrature',
  'Union syndicale des magistrats',
  'Conférence nationale des procureurs',
];

const MAGISTRATS: NonNullable<Observation['magistrat']>[] = [
  {
    currentPosition: 'Juge au tribunal judiciaire de Nantes',
    firstName: 'Léa',
    id: 'magistrat-martin',
    lastName: 'Martin',
    usedName: null,
  },
  {
    currentPosition: 'Conseillère à la cour d’appel de Lyon',
    firstName: 'Mariame',
    id: 'magistrat-konate',
    lastName: 'Konaté',
    usedName: null,
  },
  {
    currentPosition: 'Substitute générale près la cour d’appel de Douai',
    firstName: 'Amélie',
    id: 'magistrat-rousseau',
    lastName: 'Rousseau',
    usedName: null,
  },
  {
    currentPosition: 'Vice-procureur au tribunal judiciaire de Marseille',
    firstName: 'Karim',
    id: 'magistrat-benali',
    lastName: 'Benali',
    usedName: null,
  },
  {
    currentPosition: 'Première vice-présidente au tribunal judiciaire de Bordeaux',
    firstName: 'Sophie',
    id: 'magistrat-nguyen',
    lastName: 'Nguyen',
    usedName: null,
  },
  {
    currentPosition: 'Conseiller référendaire à la Cour de cassation',
    firstName: 'Étienne',
    id: 'magistrat-lefebvre',
    lastName: 'Lefebvre',
    usedName: null,
  },
];

function makeObservation(overrides: Partial<Observation> & { id: string }): Observation {
  return {
    createdAt: '2026-03-11',
    createdBy: { firstName: 'Anne', id: 'user-1', lastName: 'Roy' },
    dateReception: '2026-03-10',
    description: '',
    files: [],
    followUp: null,
    magistrat: MAGISTRATS[0]!,
    ...overrides,
  };
}

function makeFiles(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `file-${index}`,
    name: `piece-jointe-${index + 1}.pdf`,
  }));
}

const LONG_TEXT = [
  'Observation transmise par un magistrat concurrent.',
  '',
  'Le magistrat souligne plusieurs points de vigilance sur la proposition.',
].join('\n');

const OBSERVATIONS: Observation[] = [
  makeObservation({
    description: LONG_TEXT,
    files: makeFiles(1),
    followUp: 'REFERENCE',
    id: 'texte-et-piece',
    magistrat: MAGISTRATS[0],
  }),
  makeObservation({ description: LONG_TEXT, id: 'texte-seul', magistrat: MAGISTRATS[3] }),
  makeObservation({ files: makeFiles(3), followUp: 'ALERT', id: 'pieces-seules', magistrat: MAGISTRATS[2] }),
  makeObservation({ id: 'minimal', magistrat: null }),
  makeObservation({ id: 'sans-contenu-1', magistrat: MAGISTRATS[1] }),
  makeObservation({ id: 'sans-contenu-2', magistrat: MAGISTRATS[4] }),
  makeObservation({ followUp: 'INTERESTING', id: 'sans-contenu-3', magistrat: MAGISTRATS[5] }),
];

const QUALIFIED_OBSERVATIONS: Observation[] = (['ALERT', 'INTERESTING', 'REFERENCE'] as const).map(
  (followUp, index) =>
    makeObservation({
      description: 'Observation qualifiée.',
      followUp,
      id: `qualified-${index}`,
      magistrat: MAGISTRATS[index],
    }),
);

const VIEWS = ['sg', 'member'] as const;
type View = (typeof VIEWS)[number];

const NO_TAG = 'NONE';
type FollowUpControl = ObservationFollowupEnum | typeof NO_TAG;

const observationsByNominationFile = new Map<string, Observation[]>();

const observationsOf = (nominationFileId: string) => observationsByNominationFile.get(nominationFileId) ?? [];

async function readObservationForm(request: Request) {
  const data = await request.formData();
  const part = data.get('form');
  if (!(part instanceof Blob)) throw new Error('Missing "form" part in the multipart body');

  const form = JSON.parse(await part.text()) as UpdateObservationDto['form'];
  const files = data.getAll('files').filter((file): file is File => file instanceof File);
  return { detachedFileIds: [form.detachFileIds ?? []].flat(), files, form };
}

const toObservationFile = (file: File) => ({ id: crypto.randomUUID(), name: file.name });

const observationHandlers = [
  http.get('*/api/magistrats/v1', ({ request }) => {
    const search = new URL(request.url).searchParams.get('search')?.toLowerCase() ?? '';
    const items = MAGISTRATS.filter(({ firstName, lastName, usedName }) =>
      `${firstName} ${lastName} ${usedName ?? ''}`.toLowerCase().includes(search),
    ).map((magistrat) => ({ ...magistrat, grade: null, usedName: magistrat.usedName ?? '' }));

    return HttpResponse.json<SearchMagistratsResponseDto>({
      currentPageIndex: 0,
      items,
      totalCount: items.length,
    });
  }),
  http.get('*/api/sessions/v2/:sessionId/observations/attachments', () =>
    HttpResponse.json<ListedObservationsAttachmentsDto>({ items: [] }),
  ),
  http.get('*/api/sessions/v2/:sessionId/files/:nominationFileId/observations', ({ params }) =>
    HttpResponse.json<ListObservationsResponseDto>({
      observations: observationsOf(String(params.nominationFileId)),
    }),
  ),
  http.post(
    '*/api/sessions/v2/:sessionId/files/:nominationFileId/observations',
    async ({ params, request }) => {
      const nominationFileId = String(params.nominationFileId);
      const { files, form } = await readObservationForm(request);
      const observation = makeObservation({
        dateReception: form.dateReception,
        description: form.description ?? '',
        files: files.map(toObservationFile),
        id: crypto.randomUUID(),
        magistrat: MAGISTRATS.find(({ id }) => id === form.magistratId) ?? null,
      });

      observationsByNominationFile.set(nominationFileId, [observation, ...observationsOf(nominationFileId)]);
      return HttpResponse.json<CreateObservationResponseDto>({ id: observation.id }, { status: 201 });
    },
  ),
  http.put(
    '*/api/sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId',
    async ({ params, request }) => {
      const nominationFileId = String(params.nominationFileId);
      const { detachedFileIds, files, form } = await readObservationForm(request);

      observationsByNominationFile.set(
        nominationFileId,
        observationsOf(nominationFileId).map((observation) =>
          observation.id === params.observationId
            ? {
                ...observation,
                dateReception: form.dateReception,
                description: form.description ?? '',
                files: observation.files
                  .filter(({ id }) => !detachedFileIds.includes(id))
                  .concat(files.map(toObservationFile)),
                magistrat: MAGISTRATS.find(({ id }) => id === form.magistratId) ?? observation.magistrat,
              }
            : observation,
        ),
      );
      return new HttpResponse(null, { status: 204 });
    },
  ),
  http.delete(
    '*/api/sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId',
    ({ params }) => {
      const nominationFileId = String(params.nominationFileId);
      observationsByNominationFile.set(
        nominationFileId,
        observationsOf(nominationFileId).filter(({ id }) => id !== params.observationId),
      );
      return new HttpResponse(null, { status: 204 });
    },
  ),
];

type ObservationsArgs = {
  data?: Observation[];
  filesCount?: number;
  followUp?: FollowUpControl;
  observationsCount: number;
  observationText?: boolean;
  observers: number;
  view: View;
};

const nominationFileIdFor = (args: ObservationsArgs) =>
  [
    'nomination-file',
    args.data ? 'custom-data' : 'sample-data',
    args.filesCount ?? 'default-files',
    args.followUp ?? 'default-tag',
    args.observationsCount,
    args.observationText ?? 'default-text',
    args.observers,
    args.view,
  ].join('-');

function buildObservations(args: ObservationsArgs): Observation[] {
  const { filesCount, followUp, observationText } = args;

  return (args.data ?? OBSERVATIONS).slice(0, args.observationsCount).map((observation) => ({
    ...observation,
    ...(filesCount !== undefined && { files: makeFiles(filesCount) }),
    ...(followUp !== undefined && { followUp: followUp === NO_TAG ? null : followUp }),
    ...(observationText !== undefined && { description: observationText ? LONG_TEXT : '' }),
  }));
}

function ObservationsStory(props: ObservationsArgs) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(props.view === 'sg' ? ROUTE_PATHS.SG.DASHBOARD : ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
  }, [props.view, navigate]);

  const nominationFile = makeSessionNominationFile({
    id: nominationFileIdFor(props),
    content: { observants: props.observers > 0 ? OBSERVERS.slice(0, props.observers) : null },
  });

  return (
    <StoryQueryClient>
      <ObservationsModalProvider>
        <Observations nominationFile={nominationFile} sessionId={SESSION_ID} />
      </ObservationsModalProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/MagistratSidePanel/Observations',
  component: ObservationsStory,
  beforeEach: ({ args, msw }) => {
    msw.use(...observationHandlers);

    const nominationFileId = nominationFileIdFor(args);
    observationsByNominationFile.set(nominationFileId, buildObservations(args));
    return () => {
      observationsByNominationFile.delete(nominationFileId);
    };
  },
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    view: { control: 'inline-radio', options: VIEWS },
    observationsCount: { control: { type: 'range', min: 0, max: OBSERVATIONS.length, step: 1 } },
    observationText: { control: 'boolean' },
    filesCount: { control: { type: 'range', min: 0, max: 6, step: 1 } },
    followUp: {
      control: 'inline-radio',
      options: [NO_TAG, 'ALERT', 'INTERESTING', 'REFERENCE'] satisfies FollowUpControl[],
      labels: { [NO_TAG]: 'Aucun', ...ObservationFollowUpEnumLabels },
    },
    observers: { control: { type: 'range', min: 0, max: OBSERVERS.length, step: 1 } },
    data: { table: { disable: true } },
  },
  args: { view: 'sg', observationsCount: 1, observers: 0 },
} satisfies Meta<typeof ObservationsStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Member: Story = { args: { view: 'member' } };

export const Qualifications: Story = {
  args: { data: QUALIFIED_OBSERVATIONS, observationsCount: QUALIFIED_OBSERVATIONS.length },
};

export const ObserversOnly: Story = { args: { observationsCount: 0, observers: 3 } };

export const Empty: Story = { args: { observationsCount: 0 } };
