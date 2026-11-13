import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { Outlet, Route, Routes } from 'react-router';

import {
  storyCountOf,
  storyCounts,
  storyHolderOf,
} from '@/features/veille-des-postes/components/veille-des-postes.story-fixtures';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { ListedCourtOfCassationHoldersDto } from '@api/types';
import type { CourtOfCassationPosition } from '@queries/veille-des-postes.queries';

import { CourtOfCassationTab } from './CourtOfCassationTab';
import type { VeilleDesPostesOutletContext } from './veille-des-postes-outlet-context.type';

type Holder = ListedCourtOfCassationHoldersDto['items'][number] & { positionId: CourtOfCassationPosition };

const POSITIONS = [
  { id: 'FIRST_PRESIDENT', label: 'Premier président' },
  { id: 'CHAMBER_PRESIDENT', label: 'Présidents de chambre' },
  { id: 'COUNSELLOR', label: 'Conseillers' },
  { id: 'REFERENDARY_COUNSELLOR', label: 'Conseillers référendaires' },
  { id: 'AUDITOR_SECOND_GRADE', label: 'Auditeurs 2e grade' },
  { id: 'AUDITOR_FIRST_GRADE', label: 'Auditeurs 1er grade' },
] as const satisfies readonly { id: CourtOfCassationPosition; label: string }[];

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
    ...storyHolderOf(index + rank, { held: true, movesAfterSevenYears: false }),
    installationDate:
      index % 7 === 3 ? null : { day: 1 + (index % 27), month: 1 + (index % 12), year: 2016 + (index % 10) },
    magistrat: {
      id: `${rank}-${index}`,
      name: `${LAST_NAMES[(index + rank * 5) % LAST_NAMES.length]} ${FIRST_NAMES[(index * 3 + rank) % FIRST_NAMES.length]}`,
    },
    positionId: POSITIONS[rank]!.id,
    service:
      rank === 2 && index % 9 === 4
        ? { id: 'EXTRAORDINARY', label: 'Service extraordinaire' }
        : { id: 'ORDINARY', label: 'Service ordinaire' },
  })).toSorted((a, b) => a.magistrat.name.localeCompare(b.magistrat.name)),
);

const holdersHandler = http.get('*/api/veille-des-postes/v1/cour-de-cassation', ({ request }) => {
  const params = new URL(request.url).searchParams;
  const search = params.get('search')?.toLowerCase();
  const page = Number(params.get('page') ?? 1);
  const limit = Number(params.get('limit') ?? 20);

  const positions = params.getAll('positions');
  const bySearch = HOLDERS.filter((h) => !search || h.magistrat.name.toLowerCase().includes(search));
  const searched = bySearch.filter((h) => positions.length === 0 || positions.includes(h.positionId));
  const counts = storyCounts(searched);

  return HttpResponse.json<ListedCourtOfCassationHoldersDto>({
    ...counts,
    currentPageIndex: page,
    items: searched.slice((page - 1) * limit, page * limit),
    nextPageIndex: page * limit < searched.length ? page + 1 : undefined,
    positions: POSITIONS.map((position) => ({
      ...position,
      count: storyCountOf(bySearch, (h) => [h.positionId], position.id),
    })),
    totalCount: searched.length,
  });
});

/** the header of the page without its tabs, each tab having its story: the sub-tabs switch the position */
function VeilleHeader() {
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);
  const [titleSlot, setTitleSlot] = useState<HTMLSpanElement | null>(null);

  return (
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
      <Outlet context={{ filtersSlot, titleSlot } satisfies VeilleDesPostesOutletContext} />
    </PinnedHeader>
  );
}

function CourtOfCassationHoldersStory() {
  return (
    <StoryQueryClient>
      <Routes>
        <Route element={<VeilleHeader />} path={ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES}>
          <Route
            element={<CourtOfCassationTab />}
            path={ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES_COURT_OF_CASSATION_POSITION}
          />
        </Route>
      </Routes>
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
          "Les magistrats du siège de la Cour de cassation, un sous-onglet par poste, ici les conseillers. Chaque sous-onglet donne le nombre de magistrats que trouvent la recherche et les filtres. Les filtres de la colonne \"Alerte / statut\" donnent le nombre de titulaires de chaque valeur. La story ne filtre pas, c'est l'API qui le fait. En défilant, l'en-tête se colle en haut et le compteur des lignes vues apparaît à côté du titre, par pages de 20. Les candidats arriveront avec leur ticket.",
      },
    },
    layout: 'fullscreen',
    router: { initialEntries: ['/secretariat-general/csm/veille-des-postes/cour-de-cassation/conseillers'] },
  },
  title: 'Session/CSM/CourtOfCassationTab',
} satisfies Meta<typeof CourtOfCassationHoldersStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
