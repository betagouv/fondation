import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { PinnedHeader } from '@/shared/components/pinned-header';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import type { ListedCourtOfAppealFirstPresidentsDto } from '@api/types';

import { CourtOfAppealFirstPresidentsTable } from './CourtOfAppealFirstPresidentsTable';

type CourtOfAppeal = ListedCourtOfAppealFirstPresidentsDto['items'][number];

const COURTS = [
  "Cour d'appel d'Agen",
  "Cour d'appel d'Aix en Provence",
  "Cour d'appel d'Amiens",
  "Cour d'appel d'Angers",
  "Cour d'appel de Basse-Terre",
  "Cour d'appel de Bastia",
  "Cour d'appel de Besançon",
  "Cour d'appel de Bordeaux",
  "Cour d'appel de Bourges",
  "Cour d'appel de Caen",
  "Cour d'appel de Cayenne",
  "Cour d'appel de Chambéry",
  "Cour d'appel de Colmar",
  "Cour d'appel de Dijon",
  "Cour d'appel de Douai",
  "Cour d'appel de Fort-de-France",
  "Cour d'appel de Grenoble",
  "Cour d'appel de Limoges",
  "Cour d'appel de Lyon",
  "Cour d'appel de Metz",
  "Cour d'appel de Montpellier",
  "Cour d'appel de Nancy",
  "Cour d'appel de Nîmes",
  "Cour d'appel de Nouméa",
  "Cour d'appel d'Orléans",
  "Cour d'appel de Papeete",
  "Cour d'appel de Paris",
  "Cour d'appel de Pau",
  "Cour d'appel de Poitiers",
  "Cour d'appel de Reims",
  "Cour d'appel de Rennes",
  "Cour d'appel de Riom",
  "Cour d'appel de Rouen",
  "Cour d'appel de Saint-Denis de la Réunion",
  "Cour d'appel de Toulouse",
  "Cour d'appel de Versailles",
];
const LAST_NAMES = [
  'AUBERT',
  'BENALI',
  'CARON',
  'DIALLO',
  'FONTAINE',
  'HOARAU',
  'LACROIX',
  'NGUYEN',
  'VIDAL',
];
const FIRST_NAMES = ['Claire', 'Karim', 'Hélène', 'Mamadou', 'Pierre', 'Léa', 'Sophie'];

const STATUSES = [
  { id: 'OCCUPIED', label: 'Occupé' },
  { id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
  { id: 'VACANT', label: 'Vacant' },
] as const satisfies readonly CourtOfAppeal['status'][];

const VACANT_COURT = 9;

const COURTS_OF_APPEAL: CourtOfAppeal[] = COURTS.map((label, index) =>
  index === VACANT_COURT
    ? { court: { id: `${index}`, label }, installationDate: null, magistrat: null, status: STATUSES[2] }
    : {
        court: { id: `${index}`, label },
        installationDate:
          index % 11 === 4
            ? null
            : { day: 1 + (index % 27), month: 1 + (index % 12), year: 2019 + (index % 7) },
        magistrat: {
          id: `magistrat-${index}`,
          name: `${LAST_NAMES[index % LAST_NAMES.length]} ${FIRST_NAMES[index % FIRST_NAMES.length]}`,
        },
        status: STATUSES[index % 8 === 5 ? 1 : 0],
      },
);

const courtsHandler = http.get('*/api/veille-des-postes/v1/cours-d-appel', ({ request }) => {
  const params = new URL(request.url).searchParams;
  const statuses = params.getAll('statuses');
  const search = params.get('search')?.toLowerCase();
  const page = Number(params.get('page') ?? 1);
  const limit = Number(params.get('limit') ?? 20);

  const searched = COURTS_OF_APPEAL.filter(
    (court) => !search || `${court.court.label} ${court.magistrat?.name}`.toLowerCase().includes(search),
  );
  const matching = searched.filter((court) => statuses.length === 0 || statuses.includes(court.status.id));

  return HttpResponse.json<ListedCourtOfAppealFirstPresidentsDto>({
    currentPageIndex: page,
    items: matching.slice((page - 1) * limit, page * limit),
    nextPageIndex: page * limit < matching.length ? page + 1 : undefined,
    statuses: STATUSES.map((status) => ({
      ...status,
      count: searched.filter((court) => court.status.id === status.id).length,
    })),
    totalCount: matching.length,
  });
});

function CourtOfAppealFirstPresidentsStory() {
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
        <CourtOfAppealFirstPresidentsTable filtersSlot={filtersSlot} titleSlot={titleSlot} />
      </PinnedHeader>
    </StoryQueryClient>
  );
}

const meta = {
  beforeEach: ({ msw }) => {
    msw.use(courtsHandler);
  },
  component: CourtOfAppealFirstPresidentsStory,
  parameters: {
    docs: {
      description: {
        component:
          'Une ligne par cour d\'appel, par ordre alphabétique du ressort, avec son premier président. Une cour sans premier président est "Vacant". La recherche porte sur le ressort et sur le magistrat. Le filtre "Alerte / statut" donne le nombre de cours de chaque valeur. En défilant, l\'en-tête se colle en haut et le compteur des lignes vues apparaît à côté du titre, par pages de 20. Les desiderata et les candidats arriveront avec leurs tickets.',
      },
    },
    layout: 'fullscreen',
  },
  title: 'Session/CSM/CourtOfAppealFirstPresidentsTable',
} satisfies Meta<typeof CourtOfAppealFirstPresidentsStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
