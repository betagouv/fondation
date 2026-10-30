import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { generatePath } from 'react-router';

import { NominationFileOutcomeCommentModalProvider } from '../../nomination-file-outcome/NominationFileOutcomeCommentModalProvider';
import { NominationFileTargetPositionProvider } from '../../targeted-position/NominationFileTargetPositionProvider';
import { SIDE_PANEL_ID, useSidePanel } from '../context/side-panel.context';
import { SidePanelProvider } from '../context/SidePanelProvider';
import { NominationFilesTableProvider } from '@/features/nomination-files-table/context/NominationFilesTableProvider';
import { ObservationsModalProvider } from '@/features/observations/context/ObservationsModalProvider';
import { AddNominationFileAttachmentModalProvider } from '@/features/transparence/components/nomination-file-attachments/context/AddNominationFileAttachmentModalProvider';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { NominationFileLockEnum } from '@/shared/enums/nomination-file-lock.enum';
import { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';
import { PageStory } from '@/shared/storybook/PageStory';
import { useSeededNominationFiles } from '@/shared/storybook/seeded-nomination-files';
import { STORY_AUTHORS, STORY_USERS, STORY_VIEWS, type StoryView } from '@/shared/storybook/story-users';
import { makeSummary } from '@/shared/storybook/summary.fixtures';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';
import { ROUTE_PATHS, SIDE_PANEL_DOSSIER_PARAM } from '@/utils/route-path.utils';
import type {
  CreateObservationResponseDto,
  DetailedSummaryDto,
  ListedSummaryReadersDto,
  ListedNominationFileAttachmentDto,
  ListedObservationsAttachmentsDto,
  ListObservationsResponseDto,
  PaginatedMemberListItemDto,
  SearchMagistratsResponseDto,
  UpdateObservationDto,
} from '@api/types';
import type { FoundMagistrat } from '@queries/magistrats.queries';
import { sessionKeys, type SessionNominationFile } from '@queries/nomination-sessions.queries';
import type { Observation } from '@queries/observations.queries';

import { MagistratSidePanel } from './MagistratSidePanel';

const SESSION_ID = 'session-1';

const PATHS = {
  member: ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS,
  sg: ROUTE_PATHS.SG.SESSION_ID,
} satisfies Record<StoryView, string>;

const NONE = 'none';

const LOCKED_REASONS = [NONE, ...Object.values(NominationFileLockEnum)] as const;
const AUDITIONS = [NONE, 'missing', 'scheduled'] as const;
const OUTCOMES = [NONE, ...Object.values(NominationFileOutcomeEnum)] as const;
const SUMMARIES = [NONE, 'readable'] as const;

type SidePanelArgs = {
  audition: (typeof AUDITIONS)[number];
  hasAnnouncedObservers: boolean;
  hasAttachments: boolean;
  hasObservations: boolean;
  lockedReason: (typeof LOCKED_REASONS)[number];
  missingEvaluation: boolean;
  outcome: (typeof OUTCOMES)[number];
  summary: (typeof SUMMARIES)[number];
  view: StoryView;
};

const PENDING_OUTCOMES = new Set<NominationFileOutcomeEnum>(['SUSPENDED', 'WAITING_DSJ']);

const REPORTERS = [
  { firstName: 'Rachel', id: 'user-2', lastName: 'Bernard' },
  { firstName: 'Antoine', id: 'user-3', lastName: 'Roche' },
];

const { member } = STORY_USERS;
const READER = { firstName: member.firstName, id: member.id, lastName: member.lastName };

const MEMBERS: PaginatedMemberListItemDto['items'] = [
  { ...READER, excludedJurisdictions: [], formation: { id: 'SIEGE', label: 'Siège' }, status: 'ACTIVE' },
  ...REPORTERS.map((reporter) => ({
    ...reporter,
    excludedJurisdictions: [],
    formation: { id: 'SIEGE' as const, label: 'Siège' },
    status: 'ACTIVE' as const,
  })),
];

const ATTACHMENTS: ListedNominationFileAttachmentDto['items'] = [
  {
    addedAt: '2026-09-18T08:30:00.000Z',
    addedBy: STORY_AUTHORS.sg,
    id: 'attachment-1',
    name: 'fiche-de-poste-ca-paris.pdf',
    size: 248_900,
    type: 'FICHE_DE_JURIDICTION',
  },
  {
    addedAt: '2026-09-19T10:15:00.000Z',
    addedBy: STORY_AUTHORS.sg,
    id: 'attachment-2',
    name: 'note-d-intention-durand.pdf',
    size: 51_200,
    type: 'NOTE_INTENTION',
  },
];

type ObservationMagistrat = NonNullable<Observation['magistrat']>;

const MARTIN: ObservationMagistrat = {
  currentPosition: 'Juge au tribunal judiciaire de Nantes',
  firstName: 'Léa',
  id: 'magistrat-martin',
  lastName: 'Martin',
  name: 'MARTIN Léa',
};

const BENALI: ObservationMagistrat = {
  currentPosition: 'Vice-procureur au tribunal judiciaire de Marseille',
  firstName: 'Karim',
  id: 'magistrat-benali',
  lastName: 'Benali',
  name: 'BENALI Karim',
};

const FOUND_MAGISTRATS: FoundMagistrat[] = [
  {
    ...MARTIN,
    currentPosition: {
      function: { id: 'J', label: 'Juge' },
      jurisdiction: { id: 'TJ  NANTES', label: 'Tribunal judiciaire de Nantes' },
    },
    grade: 'G2',
    gradeAndJurisdiction: 'G2 - TJ NANTES',
    status: 'ACTIVE',
    usedName: null,
  },
  {
    ...BENALI,
    currentPosition: {
      function: { id: 'VPR', label: 'Vice-procureur de la République' },
      jurisdiction: { id: 'TJ  MARSEILLE', label: 'Tribunal judiciaire de Marseille' },
    },
    grade: 'G1',
    gradeAndJurisdiction: 'G1 - TJ MARSEILLE',
    status: 'ACTIVE',
    usedName: null,
  },
];

const RECEIVED_ON = { day: 21, month: 9, year: 2026 };

type MagistratObservation = Observation & { magistrat: ObservationMagistrat };

function makeObservation(
  props: Pick<MagistratObservation, 'description' | 'files' | 'followUp' | 'id' | 'magistrat'>,
): MagistratObservation {
  return {
    ...props,
    audition: null,
    createdAt: '2026-09-22',
    createdBy: { firstName: 'Sophie', id: STORY_USERS.sg.id, lastName: 'Bernard' },
    dateReception: '2026-09-21',
    observantObservationsCount: 1,
  };
}

const OBSERVATIONS = [
  makeObservation({
    description: 'Le magistrat souligne plusieurs points de vigilance sur la proposition.',
    files: [
      {
        addedAt: '2026-09-22T08:30:00.000Z',
        addedBy: STORY_AUTHORS.sg,
        id: 'observation-file-1',
        name: 'observation-martin.pdf',
        size: 120_000,
      },
    ],
    followUp: 'ALERT',
    id: 'observation-1',
    magistrat: MARTIN,
  }),
  makeObservation({ description: '', files: [], followUp: null, id: 'observation-2', magistrat: BENALI }),
];

function makeNominationFile(args: SidePanelArgs): SessionNominationFile {
  const isSg = args.view === 'sg';
  const lockedReason = args.lockedReason === NONE ? null : args.lockedReason;
  const isReported = lockedReason === 'REPORTED';

  const chosenOutcome = args.outcome === NONE ? null : args.outcome;
  // a validated official report only acts final outcomes, so a reported file never holds a pending one
  const outcome =
    isReported && (!chosenOutcome || PENDING_OUTCOMES.has(chosenOutcome)) ? 'VALIDATED' : chosenOutcome;

  const id = ['dossier', ...Object.values(args)].join('-');

  const isAuditionedPosition = args.audition !== NONE;

  return makeSessionNominationFile({
    auditionDate: args.audition === 'scheduled' ? { day: 17, month: 11, year: 2026 } : null,
    auditionRequired: isAuditionedPosition,
    // the members are not told who wanted the audition
    auditionRequirement: isSg && isAuditionedPosition ? 'POSITION' : null,
    auditionTime: args.audition === 'scheduled' ? { hours: 14, minutes: 30, seconds: 0 } : null,
    canScheduleAudition:
      lockedReason !== 'ARCHIVED_SESSION' && (outcome === null || PENDING_OUTCOMES.has(outcome)),
    comment: 'Candidature soutenue par la cheffe de cour, à rapprocher du profil attendu.',
    content: {
      datePriseDeFonctionPosteActuel: { day: 1, month: 9, year: 2021 },
      detectedMagistratId: 'magistrat-durand',
      grade: 'II',
      gradeCible: 'I',
      historique:
        '- Juge au TJ de LYON depuis le 01/09/2018 - Vice-présidente au TJ de LYON depuis le 01/09/2021 - Chargée de la coordination du pôle famille depuis le 01/01/2024',
      jurisdictions: {
        current: { id: 'TJ  LYON', label: 'Tribunal judiciaire de Lyon' },
        targeted: { id: 'CA  PARIS', label: "Cour d'appel de Paris" },
      },
      lockedReason,
      nomMagistrat: 'DURAND Camille',
      numeroDeDossier: 12,
      // the DSJ announces observers in its LODAM file: one of them has no observation recorded yet
      observants: args.hasAnnouncedObservers ? [MARTIN.name, 'ROY Anne'] : null,
      outcome: outcome && {
        comment: isSg && outcome === 'NON_VALIDATED' ? 'Le profil ne correspond pas au poste.' : null,
        value: outcome,
      },
      posteActuel: 'Vice-présidente au tribunal judiciaire de LYON',
      posteCible: 'Conseillère à la cour d’appel de PARIS',
      rang: '(12 sur 45)',
      status: isReported
        ? { dates: [{ day: 5, month: 10, year: 2026 }], value: 'DSJ_REPORTED' }
        : { dates: [], value: 'TO_REPORT' },
    },
    expectedReportersCount: isAuditionedPosition ? 2 : null,
    hasAttachment: args.hasAttachments,
    hasJurisdictionSheet: args.hasAttachments,
    id,
    isArchived: lockedReason === 'ARCHIVED_SESSION',
    memo: isSg ? null : { value: null },
    missingEvaluation: args.missingEvaluation,
    observations: args.hasObservations
      ? OBSERVATIONS.map(({ description, followUp, id, magistrat }) => ({
          audition: null,
          date: RECEIVED_ON,
          followUp,
          followUpComment: null,
          hasDescription: !!description,
          hasUserComment: false,
          id,
          magistrat: { id: magistrat.id, name: magistrat.name },
        }))
      : [],
    priorities: ['ETOILE'],
    reporters: REPORTERS,
    summary: args.summary === 'readable' ? { canRead: true, canWrite: isSg, id } : null,
  });
}

// msw handlers are set once while the data changes with the controls: the story fills these stores,
// keyed by nomination file, before the panel asks for them
const attachmentsByFile = new Map<string, ListedNominationFileAttachmentDto['items']>();
const observationsByFile = new Map<string, Observation[]>();

async function readObservationForm(request: Request) {
  const data = await request.formData();
  const form = JSON.parse(await (data.get('form') as Blob).text()) as UpdateObservationDto['form'];
  const files = data
    .getAll('files')
    .filter((file): file is File => file instanceof File)
    .map((file) => ({
      addedAt: new Date().toISOString(),
      addedBy: STORY_AUTHORS.sg,
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
    }));

  return { detachedFileIds: [form.detachFileIds ?? []].flat(), files, form };
}

const magistratOf = (id: string) => [MARTIN, BENALI].find((magistrat) => magistrat.id === id);

const noContent = () => new HttpResponse(null, { status: 204 });

const handlers = [
  http.get('*/api/members/v1', () =>
    HttpResponse.json<PaginatedMemberListItemDto>({
      currentPageIndex: 1,
      items: MEMBERS,
      totalCount: MEMBERS.length,
    }),
  ),
  http.post('*/api/sessions/v2/:sessionId/files/reporters', noContent),
  http.put('*/api/sessions/v2/:sessionId/files/priorities', noContent),

  http.get('*/api/sessions/v2/:sessionId/files/:nominationFileId/summary/readers', () =>
    HttpResponse.json<ListedSummaryReadersDto>({
      items: MEMBERS.map(({ firstName, id, lastName }) => ({
        displayedRole: { id: 'MEMBRE_SIEGE' as const, label: 'Membre du siège' },
        firstName,
        id,
        lastName,
      })),
    }),
  ),
  http.put('*/api/sessions/v2/:sessionId/files/:nominationFileId/summary/readers', noContent),

  http.get('*/api/sessions/v2/:sessionId/files/:nominationFileId/attachments', ({ params }) =>
    HttpResponse.json<ListedNominationFileAttachmentDto>({
      items: attachmentsByFile.get(String(params.nominationFileId)) ?? [],
    }),
  ),
  http.put(
    '*/api/sessions/v2/:sessionId/files/:nominationFileId/attachments',
    async ({ params, request }) => {
      const nominationFileId = String(params.nominationFileId);
      const formData = await request.formData();
      const { type } = JSON.parse(await (formData.get('form') as Blob).text());
      const uploaded = formData
        .getAll('files')
        .filter((file): file is File => file instanceof File)
        .map((file) => ({
          addedAt: new Date().toISOString(),
          addedBy: STORY_AUTHORS.sg,
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type,
        }));

      attachmentsByFile.set(nominationFileId, [
        ...(attachmentsByFile.get(nominationFileId) ?? []),
        ...uploaded,
      ]);
      return noContent();
    },
  ),
  http.delete('*/api/sessions/v2/:sessionId/files/:nominationFileId/attachments/:fileId', ({ params }) => {
    const nominationFileId = String(params.nominationFileId);
    attachmentsByFile.set(
      nominationFileId,
      (attachmentsByFile.get(nominationFileId) ?? []).filter(({ id }) => id !== params.fileId),
    );
    return noContent();
  }),

  http.get('*/api/magistrats/v1', ({ request }) => {
    const search = new URL(request.url).searchParams.get('search')?.toLowerCase() ?? '';
    const items = FOUND_MAGISTRATS.filter(({ name }) => name.toLowerCase().includes(search));

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
      observations: observationsByFile.get(String(params.nominationFileId)) ?? [],
    }),
  ),
  http.post(
    '*/api/sessions/v2/:sessionId/files/:nominationFileId/observations',
    async ({ params, request }) => {
      const nominationFileId = String(params.nominationFileId);
      const { files, form } = await readObservationForm(request);
      const observation: Observation = {
        ...makeObservation({
          description: form.description ?? '',
          files,
          followUp: null,
          id: crypto.randomUUID(),
          magistrat: magistratOf(form.magistratId) ?? MARTIN,
        }),
        dateReception: form.dateReception,
      };

      observationsByFile.set(nominationFileId, [
        observation,
        ...(observationsByFile.get(nominationFileId) ?? []),
      ]);
      return HttpResponse.json<CreateObservationResponseDto>({ id: observation.id }, { status: 201 });
    },
  ),
  http.patch(
    '*/api/sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId',
    async ({ params, request }) => {
      const nominationFileId = String(params.nominationFileId);
      const { detachedFileIds, files, form } = await readObservationForm(request);

      observationsByFile.set(
        nominationFileId,
        (observationsByFile.get(nominationFileId) ?? []).map((observation) =>
          observation.id === params.observationId
            ? {
                ...observation,
                dateReception: form.dateReception,
                description: form.description ?? '',
                files: observation.files.filter(({ id }) => !detachedFileIds.includes(id)).concat(files),
                magistrat: magistratOf(form.magistratId) ?? observation.magistrat,
              }
            : observation,
        ),
      );
      return noContent();
    },
  ),
  http.delete(
    '*/api/sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId',
    ({ params }) => {
      const nominationFileId = String(params.nominationFileId);
      observationsByFile.set(
        nominationFileId,
        (observationsByFile.get(nominationFileId) ?? []).filter(({ id }) => id !== params.observationId),
      );
      return noContent();
    },
  ),
];

// stands for the magistrat name of the table, absent from the story: the only way back once the panel is closed
function OpenSidePanelButton(props: { nominationFileId: string }) {
  const { isOpen, open } = useSidePanel();

  return (
    <div className="fr-container fr-py-8v">
      <Button disabled={isOpen} onClick={() => open(props.nominationFileId)}>
        Ouvrir le panneau
      </Button>
    </div>
  );
}

function SeededSidePanel(props: { nominationFile: SessionNominationFile }) {
  const nominationFiles = useSeededNominationFiles({ files: [props.nominationFile], sessionId: SESSION_ID });

  return (
    <SidePanelProvider
      isFetching={false}
      nominationFiles={nominationFiles}
      onEndReached={() => {}}
      totalCount={nominationFiles.length}
    >
      <OpenSidePanelButton nominationFileId={props.nominationFile.id} />
      <NominationFileOutcomeCommentModalProvider>
        <NominationFileTargetPositionProvider sessionId={SESSION_ID}>
          <AddNominationFileAttachmentModalProvider>
            <MagistratSidePanel sessionId={SESSION_ID} />
          </AddNominationFileAttachmentModalProvider>
        </NominationFileTargetPositionProvider>
      </NominationFileOutcomeCommentModalProvider>
    </SidePanelProvider>
  );
}

function MagistratSidePanelStory(args: SidePanelArgs) {
  const nominationFile = makeNominationFile(args);
  const isArchived = nominationFile.isArchived;

  if (!attachmentsByFile.has(nominationFile.id))
    attachmentsByFile.set(nominationFile.id, args.hasAttachments ? [...ATTACHMENTS] : []);
  if (!observationsByFile.has(nominationFile.id))
    observationsByFile.set(nominationFile.id, args.hasObservations ? [...OBSERVATIONS] : []);

  return (
    <PageStory
      key={nominationFile.id}
      location={generatePath(PATHS[args.view], { sessionId: SESSION_ID })}
      path={PATHS[args.view]}
      seed={(client) =>
        client.setQueryData(sessionKeys.listSessionNominationFiles({ sessionId: SESSION_ID }), {
          pageParams: [0],
          pages: [{ items: [nominationFile] }],
        })
      }
      view={args.view}
    >
      <NuqsTestingAdapter hasMemory searchParams={{ [SIDE_PANEL_DOSSIER_PARAM]: nominationFile.id }}>
        <ArchiveBannerPortal isArchived={isArchived}>
          <NominationFilesTableProvider
            canManage={args.view === 'sg' && !isArchived}
            formation="SIEGE"
            outcomes={makeSessionOutcomes('SIEGE')}
            sessionId={SESSION_ID}
          >
            <ObservationsModalProvider>
              <SeededSidePanel nominationFile={nominationFile} />
            </ObservationsModalProvider>
          </NominationFilesTableProvider>
        </ArchiveBannerPortal>
      </NuqsTestingAdapter>
    </PageStory>
  );
}

const meta = {
  args: {
    audition: 'missing',
    hasAnnouncedObservers: false,
    hasAttachments: true,
    hasObservations: true,
    lockedReason: NONE,
    missingEvaluation: false,
    outcome: NONE,
    summary: 'readable',
    view: 'sg',
  },
  argTypes: {
    audition: {
      control: 'inline-radio',
      description: 'missing and scheduled describe a position that requires an audition, and 2 reporters',
      options: AUDITIONS,
    },
    hasAnnouncedObservers: { control: 'boolean' },
    hasAttachments: { control: 'boolean' },
    hasObservations: { control: 'boolean' },
    lockedReason: {
      control: 'inline-radio',
      description:
        'a reported file always holds a final outcome: VALIDATED stands in for a pending or no outcome',
      options: LOCKED_REASONS,
    },
    missingEvaluation: { control: 'boolean' },
    outcome: {
      control: 'inline-radio',
      description: 'a final outcome closes the audition scheduling, members never see the comment',
      options: OUTCOMES,
    },
    summary: {
      control: 'inline-radio',
      description: 'written by the SG and shared with the member',
      options: SUMMARIES,
    },
    view: { control: 'inline-radio', options: STORY_VIEWS },
  },
  beforeEach: ({ args, msw }) => {
    msw.use(
      ...handlers,
      http.get('*/api/sessions/v2/:sessionId/files/:nominationFileId/summary', () =>
        HttpResponse.json<DetailedSummaryDto>(
          makeSummary({
            name: 'DURAND Camille',
            position: 'Vice-présidente au tribunal judiciaire de LYON',
            summary: { canWrite: args.view === 'sg', readers: [READER] },
            targetedPosition: 'Conseillère à la cour d’appel de PARIS',
          }),
        ),
      ),
    );
  },
  component: MagistratSidePanelStory,
  decorators: [
    (Story) => (
      <>
        {/* the utilities are imported important: an important rule only wins from an earlier layer */}
        <style>{`@layer base { @media (min-width: 48rem) { #${SIDE_PANEL_ID} { width: 56% !important; } } }`}</style>
        <Story />
      </>
    ),
  ],
  parameters: { layout: 'fullscreen' },
  title: 'Features/MagistratSidePanel',
} satisfies Meta<typeof MagistratSidePanelStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
