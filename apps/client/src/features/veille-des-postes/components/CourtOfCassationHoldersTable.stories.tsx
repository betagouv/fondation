import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { PinnedHeader } from '@/shared/components/pinned-header';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import type { ListedCourtOfCassationHoldersDto } from '@api/types';

import { CourtOfCassationHoldersTable } from './CourtOfCassationHoldersTable';

type Holder = ListedCourtOfCassationHoldersDto['items'][number];

const POSITIONS = [
  { id: 'FIRST_PRESIDENT', label: 'Premier président' },
  { id: 'CHAMBER_PRESIDENT', label: 'Président de chambre' },
  { id: 'COUNSELLOR', label: 'Conseiller' },
  { id: 'REFERENDARY_COUNSELLOR', label: 'Conseiller référendaire' },
  { id: 'AUDITOR_FIRST_GRADE', label: 'Auditeur 1er grade' },
  { id: 'AUDITOR_SECOND_GRADE', label: 'Auditeur 2e grade' },
] as const satisfies readonly Holder['position'][];

const STATUSES = [
  { id: 'OCCUPIED', label: 'Occupé' },
  { id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
  { id: 'VACANT', label: 'Vacant' },
] as const satisfies readonly Holder['status'][];

const HOLDERS_PER_POSITION = [1, 4, 28, 20, 5, 6];
const LAST_NAMES = [
  'AUBERT',
  'BENALI',
  'CARON',
  'DIALLO',
  'ETCHEBARNE',
  'FONTAINE',
  'GARNIER',
  'HOARAU',
  'KELLER',
  'LACROIX',
  'MOREL',
  'NGUYEN',
  'PEREIRA',
  'ROSSI',
  'SY',
  'VIDAL',
  'WEBER',
];
const FIRST_NAMES = [
  'Claire',
  'Karim',
  'Hélène',
  'Mamadou',
  'Pierre',
  'Léa',
  'Sophie',
  'Olivier',
  'Linh',
  'Laurent',
  'Inès',
  'Thomas',
  'Nathalie',
];

const HOLDERS: Holder[] = HOLDERS_PER_POSITION.flatMap((count, rank) =>
  Array.from({ length: count }, (_, index): Holder => ({
    installationDate:
      index % 7 === 3 ? null : { day: 1 + (index % 27), month: 1 + (index % 12), year: 2016 + (index % 10) },
    magistrat: {
      id: `${rank}-${index}`,
      name: `${LAST_NAMES[(index + rank * 5) % LAST_NAMES.length]} ${FIRST_NAMES[(index * 3 + rank) % FIRST_NAMES.length]}`,
    },
    position: POSITIONS[rank]!,
    service:
      rank === 2 && index % 9 === 4
        ? { id: 'EXTRAORDINARY', label: 'Service extraordinaire' }
        : { id: 'ORDINARY', label: 'Service ordinaire' },
    status: STATUSES[index % 5 === 2 ? 1 : index % 11 === 7 ? 2 : 0]!,
  })).toSorted((a, b) => a.magistrat.name.localeCompare(b.magistrat.name)),
);

const holdersHandler = http.get('*/api/veille-des-postes/v1/cour-de-cassation', ({ request }) => {
  const params = new URL(request.url).searchParams;
  const positions = params.getAll('positions');
  const statuses = params.getAll('statuses');
  const search = params.get('search')?.toLowerCase();
  const page = Number(params.get('page') ?? 1);
  const limit = Number(params.get('limit') ?? 20);

  const searched = HOLDERS.filter((h) => !search || h.magistrat.name.toLowerCase().includes(search));
  const ofPositions = (h: Holder) => positions.length === 0 || positions.includes(h.position.id);
  const ofStatuses = (h: Holder) => statuses.length === 0 || statuses.includes(h.status.id);
  const matching = searched.filter((h) => ofPositions(h) && ofStatuses(h));

  return HttpResponse.json<ListedCourtOfCassationHoldersDto>({
    currentPageIndex: page,
    items: matching.slice((page - 1) * limit, page * limit),
    nextPageIndex: page * limit < matching.length ? page + 1 : undefined,
    positions: POSITIONS.map((position) => ({
      ...position,
      holders: searched.filter((h) => h.position.id === position.id && ofStatuses(h)).length,
    })),
    statuses: STATUSES.map((status) => ({
      ...status,
      holders: searched.filter((h) => h.status.id === status.id && ofPositions(h)).length,
    })),
    totalCount: matching.length,
  });
});

function CourtOfCassationHoldersStory() {
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);
  const [titleSlot, setTitleSlot] = useState<HTMLSpanElement | null>(null);

  return (
    <StoryQueryClient>
      <PinnedHeader
        bar={(isPinned) => (
          <div className="fr-container flex flex-col gap-y-4">
            <h1 className="fr-h3 fr-mb-0">
              Veille des postes
              {isPinned && <span ref={setTitleSlot} />}
            </h1>
            <div className="min-h-10" ref={setFiltersSlot} />
          </div>
        )}
        barClassName="fr-pt-6v"
        contentClassName="fr-container fr-mt-6v fr-mb-8v"
      >
        <CourtOfCassationHoldersTable filtersSlot={filtersSlot} titleSlot={titleSlot} />
      </PinnedHeader>
    </StoryQueryClient>
  );
}

const meta = {
  beforeEach: ({ msw }) => {
    msw.use(holdersHandler);
  },
  component: CourtOfCassationHoldersStory,
  parameters: {
    docs: {
      description: {
        component:
          'Les magistrats du siège de la Cour de cassation, par poste dans l\'ordre de la hiérarchie puis par nom. Un trait bleu marque le passage à un autre poste. Les filtres "Poste" et "Alerte / statut" donnent le nombre de titulaires de chaque valeur. En défilant, l\'en-tête se colle en haut et le compteur des lignes vues apparaît à côté du titre, par pages de 20. Les desiderata et les candidats arriveront avec leurs tickets.',
      },
    },
    layout: 'fullscreen',
  },
  title: 'Session/CSM/CourtOfCassationHoldersTable',
} satisfies Meta<typeof CourtOfCassationHoldersStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
