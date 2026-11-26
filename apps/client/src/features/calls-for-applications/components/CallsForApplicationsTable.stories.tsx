import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { PinnedHeader } from '@/shared/components/pinned-header';
import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { STORY_USERS } from '@/shared/storybook/story-users';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import type {
  CreatedCallForApplicationsDto,
  FoundCallForApplicationsFormDto,
  ListedCallsForApplicationsDto,
} from '@api/types';
import { authKeys } from '@queries/auth.queries';

import { CallsForApplicationsTable } from './CallsForApplicationsTable';
import { CreateCallForApplicationsButton } from './CreateCallForApplicationsButton';

type ListedCall = ListedCallsForApplicationsDto['items'][number];
type HistoryEntry = ListedCall['history'][number];
type Change = HistoryEntry['changes'][number];

const ME = { id: STORY_USERS.sg.id, name: 'Sophie BERNARD' };
const HELENE = { id: 'user-2', name: 'Hélène GARNIER' };
const PAUL = { id: 'user-3', name: 'Paul MARTIN' };

const ADDED = { id: 'ADDED', label: 'ajouté' } as const;
const CHANGED = { id: 'CHANGED', label: 'modifié' } as const;
const REMOVED = { id: 'REMOVED', label: 'retiré' } as const;

const COURTS = {
  'CA  AGEN': { id: 'CA  AGEN', label: "Cour d'appel d'Agen", type: 'COURT_OF_APPEAL' },
  'CA  LYON': { id: 'CA  LYON', label: "Cour d'appel de Lyon", type: 'COURT_OF_APPEAL' },
  'TJ  AGEN': { id: 'TJ  AGEN', label: "Tribunal judiciaire d'Agen", type: 'JUDICIAL_COURT' },
  'TJ  AUCH': { id: 'TJ  AUCH', label: "Tribunal judiciaire d'Auch", type: 'JUDICIAL_COURT' },
  'TJ  CAHORS': { id: 'TJ  CAHORS', label: 'Tribunal judiciaire de Cahors', type: 'JUDICIAL_COURT' },
  'TJ  CRETEIL': { id: 'TJ  CRETEIL', label: 'Tribunal judiciaire de Créteil', type: 'JUDICIAL_COURT' },
  'TJ  LYON': { id: 'TJ  LYON', label: 'Tribunal judiciaire de Lyon', type: 'JUDICIAL_COURT' },
  'TJ  PARIS': { id: 'TJ  PARIS', label: 'Tribunal judiciaire de Paris', type: 'JUDICIAL_COURT' },
  'TPI NOUMEA': {
    id: 'TPI NOUMEA',
    label: 'Tribunal de première instance de Nouméa',
    type: 'JUDICIAL_COURT',
  },
} as const;

const GENERAL = { id: 'GENERAL', label: 'Général' } as const;
const PUBLISHED = { id: 'PUBLISHED', label: 'Publié' } as const;
const UNPUBLISHED = { id: 'UNPUBLISHED', label: 'Non publié' } as const;

/** a call as the API lists it: general and without a target by default */
function call(
  listed: Omit<
    ListedCall,
    'comment' | 'guidelinesAdaptations' | 'targetCourts' | 'targetLabel' | 'targetPositions' | 'type'
  > &
    Partial<
      Pick<
        ListedCall,
        'comment' | 'guidelinesAdaptations' | 'targetCourts' | 'targetLabel' | 'targetPositions' | 'type'
      >
    >,
): ListedCall {
  return {
    comment: null,
    guidelinesAdaptations: [],
    targetCourts: [],
    targetLabel: "Cours d'appel et tribunaux judiciaires",
    targetPositions: [],
    type: GENERAL,
    ...listed,
  };
}

function created(at: string, by: HistoryEntry['by']): HistoryEntry {
  return { action: 'CREATED', at, by, changes: [] };
}

function updated(at: string, by: HistoryEntry['by'], changes: Change[]): HistoryEntry {
  return { action: 'UPDATED', at, by, changes };
}

function changed(change: Change['change'], label: string, targets: Change['targets'] = null): Change {
  return { change, label, targets };
}

const CALLS: Record<'ONGOING' | 'PAST', ListedCall[]> = {
  ONGOING: [
    call({
      canChange: true,
      createdOn: { day: 24, month: 11, year: 2026 },
      deadline: { day: 31, month: 1, year: 2027 },
      history: [
        updated('2026-11-25T10:00:00.000Z', ME, [
          changed(ADDED, 'le président de chambre aux postes cibles'),
        ]),
        created('2026-11-24T08:00:00.000Z', HELENE),
      ],
      id: 'call-ccass',
      publishedOn: { day: 5, month: 1, year: 2027 },
      status: UNPUBLISHED,
      targetLabel: 'Premier président, Président de chambre et Conseiller',
      targetPositions: [
        { id: 'FIRST_PRESIDENT', label: 'Premier président' },
        { id: 'CHAMBER_PRESIDENT', label: 'Président de chambre' },
        { id: 'COUNSELLOR', label: 'Conseiller' },
      ],
      type: { id: 'CCASS', label: 'Cour de cassation' },
    }),
    call({
      canChange: true,
      comment: 'Présidences vacantes au 1er mars',
      createdOn: { day: 23, month: 11, year: 2026 },
      deadline: { day: 22, month: 1, year: 2027 },
      guidelinesAdaptations: [{ id: 'JUDICIAL_COURT', label: 'Tribunaux judiciaires' }],
      history: [
        updated('2026-11-26T09:00:00.000Z', ME, [
          changed(
            ADDED,
            "l'adaptation aux lignes directrices de gestion sur la durée d'affectation du poste actuel pour les tribunaux judiciaires",
          ),
        ]),
        updated('2026-11-25T09:00:00.000Z', ME, [
          changed(CHANGED, 'la date limite du 15/01/2027 au 22/01/2027'),
          changed(ADDED, 'un commentaire'),
        ]),
        updated('2026-11-24T16:00:00.000Z', PAUL, [
          changed(ADDED, 'le tribunal judiciaire de Cahors et le tribunal de première instance de Nouméa'),
          changed(REMOVED, "le tribunal judiciaire d'Agen"),
        ]),
        updated('2026-11-23T17:00:00.000Z', HELENE, [
          changed(ADDED, '4 juridictions cibles', [
            { label: COURTS['CA  AGEN'].label },
            { label: COURTS['TJ  AGEN'].label },
            { label: COURTS['TJ  AUCH'].label },
            { label: COURTS['TJ  PARIS'].label },
          ]),
          changed(REMOVED, 'le tribunal judiciaire de Créteil'),
        ]),
        created('2026-11-23T15:00:00.000Z', HELENE),
      ],
      id: 'call-specific',
      publishedOn: { day: 2, month: 1, year: 2027 },
      status: UNPUBLISHED,
      targetCourts: [COURTS['CA  AGEN'], COURTS['TJ  AUCH'], COURTS['TJ  CAHORS'], COURTS['TPI NOUMEA']],
      targetLabel:
        "Cour d'appel d'Agen, Tribunal judiciaire d'Auch, Tribunal judiciaire de Cahors et Tribunal de première instance de Nouméa",
      type: { id: 'SPECIFIC', label: 'Spécifique' },
    }),
    call({
      canChange: true,
      createdOn: { day: 20, month: 11, year: 2026 },
      deadline: null,
      history: [created('2026-11-20T09:30:00.000Z', ME)],
      id: 'call-draft',
      publishedOn: null,
      status: UNPUBLISHED,
    }),
    call({
      canChange: true,
      createdOn: { day: 3, month: 11, year: 2026 },
      deadline: { day: 15, month: 1, year: 2027 },
      history: [
        updated('2026-11-10T14:00:00.000Z', PAUL, [
          changed(CHANGED, "le type d'appel de Spécifique en Général"),
          changed(
            REMOVED,
            "la cour d'appel de Lyon et le tribunal judiciaire de Lyon des juridictions cibles",
          ),
        ]),
        updated('2026-11-05T11:00:00.000Z', HELENE, [changed(ADDED, 'la date de publication du 01/12/2026')]),
        created('2026-11-03T10:00:00.000Z', HELENE),
      ],
      id: 'call-retyped',
      publishedOn: { day: 1, month: 12, year: 2026 },
      status: UNPUBLISHED,
    }),
    call({
      canChange: false,
      createdOn: { day: 2, month: 11, year: 2026 },
      deadline: { day: 20, month: 12, year: 2026 },
      history: [created('2026-11-02T08:30:00.000Z', HELENE)],
      id: 'call-published',
      publishedOn: { day: 15, month: 11, year: 2026 },
      status: PUBLISHED,
    }),
  ],
  PAST: [
    call({
      canChange: false,
      createdOn: { day: 2, month: 10, year: 2026 },
      deadline: { day: 15, month: 11, year: 2026 },
      history: [
        updated('2026-10-10T09:00:00.000Z', null, [changed(REMOVED, 'le commentaire')]),
        created('2026-10-02T14:00:00.000Z', null),
      ],
      id: 'call-past-general',
      publishedOn: { day: 15, month: 10, year: 2026 },
      status: PUBLISHED,
    }),
    call({
      canChange: false,
      createdOn: { day: 1, month: 9, year: 2026 },
      deadline: { day: 30, month: 9, year: 2026 },
      history: [
        updated('2026-09-03T10:00:00.000Z', PAUL, [
          changed(REMOVED, 'le tribunal judiciaire de Créteil des juridictions cibles'),
        ]),
        created('2026-09-01T10:00:00.000Z', PAUL),
      ],
      id: 'call-past-specific',
      publishedOn: { day: 10, month: 9, year: 2026 },
      status: PUBLISHED,
      targetCourts: [COURTS['TJ  PARIS']],
      targetLabel: COURTS['TJ  PARIS'].label,
      type: { id: 'SPECIFIC', label: 'Spécifique' },
    }),
    call({
      canChange: false,
      createdOn: { day: 2, month: 6, year: 2026 },
      deadline: { day: 30, month: 6, year: 2026 },
      history: [
        // a change journaled before the values were: no date and no detail
        updated('2026-06-10T10:00:00.000Z', HELENE, [changed(CHANGED, 'la date limite')]),
        created('2026-06-02T10:00:00.000Z', HELENE),
      ],
      id: 'call-past-ccass',
      publishedOn: { day: 15, month: 6, year: 2026 },
      status: PUBLISHED,
      targetLabel: 'Conseiller référendaire',
      targetPositions: [{ id: 'REFERENDARY_COUNSELLOR', label: 'Conseiller référendaire' }],
      type: { id: 'CCASS', label: 'Cour de cassation' },
    }),
  ],
};

const FORM: FoundCallForApplicationsFormDto = {
  commentMaxLength: 50_000,
  dateRange: { max: '2100-12-31', min: '2000-01-01' },
  targetCourtTypes: [
    {
      courts: [COURTS['CA  AGEN'], COURTS['CA  LYON']],
      guidelinesAdaptationLabel:
        "Adaptation aux lignes directrices de gestion sur la durée d'affectation du poste actuel pour les cours d'appel",
      type: { id: 'COURT_OF_APPEAL', label: "Cours d'appel" },
      typeInSentence: "cours d'appel",
    },
    {
      courts: [
        COURTS['TJ  AGEN'],
        COURTS['TJ  AUCH'],
        COURTS['TJ  CAHORS'],
        COURTS['TJ  CRETEIL'],
        COURTS['TJ  LYON'],
        COURTS['TPI NOUMEA'],
        COURTS['TJ  PARIS'],
      ],
      guidelinesAdaptationLabel:
        "Adaptation aux lignes directrices de gestion sur la durée d'affectation du poste actuel pour les tribunaux judiciaires",
      type: { id: 'JUDICIAL_COURT', label: 'Tribunaux judiciaires' },
      typeInSentence: 'tribunaux judiciaires',
    },
  ],
  targetPositions: [
    { id: 'FIRST_PRESIDENT', label: 'Premier président' },
    { id: 'CHAMBER_PRESIDENT', label: 'Président de chambre' },
    { id: 'COUNSELLOR', label: 'Conseiller' },
    { id: 'REFERENDARY_COUNSELLOR', label: 'Conseiller référendaire' },
    { id: 'AUDITOR_SECOND_GRADE', label: 'Auditeur 2e grade' },
    { id: 'AUDITOR_FIRST_GRADE', label: 'Auditeur 1er grade' },
  ],
  types: [
    {
      type: { id: 'GENERAL', label: 'Général' },
      scope: "Vise tous les postes des cours d'appel et des tribunaux judiciaires",
      targetPick: 'NONE',
    },
    {
      type: { id: 'SPECIFIC', label: 'Spécifique' },
      scope: 'Vise la présidence des juridictions choisies',
      targetPick: 'COURTS',
    },
    {
      type: { id: 'CCASS', label: 'Cour de cassation' },
      scope: 'Vise les postes de la Cour de cassation choisis',
      targetPick: 'POSITIONS',
    },
  ],
};

function CallsForApplicationsTableStory(props: {
  deadlineRefused: boolean;
  deleteFails: boolean;
  empty: boolean;
  formLoadFails: boolean;
  loadFails: boolean;
  nextPageFails: boolean;
  period: 'ONGOING' | 'PAST';
  saveFails: boolean;
}) {
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);

  return (
    <StoryQueryClient
      key={JSON.stringify(props)}
      seed={(client) => client.setQueryData(authKeys.introspectSession(), STORY_USERS.sg)}
    >
      <ToastProvider>
        <ConfirmModalProvider>
          <PinnedHeader
            bar={() => (
              <div className="fr-container flex flex-col gap-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h1 className="fr-h3 fr-mb-0">Appels à candidatures</h1>
                  <CreateCallForApplicationsButton />
                </div>
                <div className="min-h-10" ref={setFiltersSlot} />
              </div>
            )}
            barClassName="fr-pt-6v"
            contentClassName="fr-container fr-mt-6v fr-mb-8v"
          >
            <CallsForApplicationsTable filtersSlot={filtersSlot} period={props.period} />
          </PinnedHeader>
        </ConfirmModalProvider>
      </ToastProvider>
    </StoryQueryClient>
  );
}

/** the answer of a failed creation or update (none when it succeeds) */
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
    period: {
      control: 'inline-radio',
      description: 'Les appels en cours ou passés.',
      options: ['ONGOING', 'PAST'],
    },
    saveFails: { control: 'boolean', description: 'La création ou la modification répond par une erreur.' },
  },
  beforeEach: ({ args, msw }) => {
    msw.use(
      http.get('*/api/calls-for-applications/v1', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        if (args.loadFails || (args.nextPageFails && page > 1))
          return new HttpResponse(null, { status: 500 });

        const items = args.empty ? [] : CALLS[args.period];
        return HttpResponse.json<ListedCallsForApplicationsDto>({
          currentPageIndex: page,
          items,
          nextPageIndex: args.nextPageFails ? page + 1 : undefined,
          statuses: [UNPUBLISHED, PUBLISHED],
          totalCount: args.nextPageFails ? items.length + 1 : items.length,
          types: FORM.types.map(({ type }) => type),
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
          HttpResponse.json<CreatedCallForApplicationsDto>({ id: 'call-new' }, { status: 201 }),
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
  component: CallsForApplicationsTableStory,
  parameters: {
    docs: {
      description: {
        component:
          "Les appels à candidatures en cours ou passés, avec le bouton de création au-dessus. Chaque ligne s'ouvre en modification, se supprime ou montre son historique. L'historique dit ce qui a été ajouté, retiré ou modifié avec les dates et les types d'avant et d'après, et nomme jusqu'à trois juridictions ou postes changés. Au-delà, une infobulle les liste. Un appel publié ne se modifie plus que par un administrateur. La story ne filtre ni ne trie : c'est l'API qui le fait.",
      },
    },
    layout: 'fullscreen',
  },
  title: 'Session/CSM/CallsForApplications/CallsForApplicationsTable',
} satisfies Meta<typeof CallsForApplicationsTableStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
