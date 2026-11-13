import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { PinnedHeader } from '@/shared/components/pinned-header';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import type { ListedJudicialCourtPresidentsDto } from '@api/types';

import { JudicialCourtPresidentsTable } from './JudicialCourtPresidentsTable';

type JudicialCourt = ListedJudicialCourtPresidentsDto['items'][number];

const RESSORTS: [string, string[]][] = [
  [
    "Cour d'appel d'Agen",
    ["Tribunal judiciaire d'Agen", "Tribunal judiciaire d'Auch", 'Tribunal judiciaire de Cahors'],
  ],
  [
    "Cour d'appel d'Aix en Provence",
    [
      "Tribunal judiciaire d'Aix-en-Provence",
      'Tribunal judiciaire de Digne-les-Bains',
      'Tribunal judiciaire de Draguignan',
      'Tribunal judiciaire de Grasse',
      'Tribunal judiciaire de Marseille',
      'Tribunal judiciaire de Nice',
      'Tribunal judiciaire de Tarascon',
      'Tribunal judiciaire de Toulon',
    ],
  ],
  [
    "Cour d'appel de Lyon",
    [
      'Tribunal judiciaire de Bourg-en-Bresse',
      'Tribunal judiciaire de Lyon',
      'Tribunal judiciaire de Roanne',
      'Tribunal judiciaire de Saint-Étienne',
      'Tribunal judiciaire de Villefranche-sur-Saône',
    ],
  ],
  [
    "Cour d'appel de Paris",
    [
      "Tribunal judiciaire d'Auxerre",
      'Tribunal judiciaire de Bobigny',
      'Tribunal judiciaire de Créteil',
      "Tribunal judiciaire d'Évry",
      'Tribunal judiciaire de Fontainebleau',
      'Tribunal judiciaire de Meaux',
      'Tribunal judiciaire de Melun',
      'Tribunal judiciaire de Paris',
      'Tribunal judiciaire de Sens',
    ],
  ],
  [
    "Cour d'appel de Rennes",
    [
      'Tribunal judiciaire de Brest',
      'Tribunal judiciaire de Lorient',
      'Tribunal judiciaire de Nantes',
      'Tribunal judiciaire de Quimper',
      'Tribunal judiciaire de Rennes',
      'Tribunal judiciaire de Saint-Brieuc',
      'Tribunal judiciaire de Saint-Malo',
      'Tribunal judiciaire de Saint-Nazaire',
      'Tribunal judiciaire de Vannes',
    ],
  ],
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
] as const satisfies readonly JudicialCourt['status'][];

const VACANT_COURTS = new Set([4, 17]);

const JUDICIAL_COURTS: JudicialCourt[] = RESSORTS.flatMap(([ressort, courts], ressortIndex) =>
  courts.map((label) => ({ label, ressort: { id: `ressort-${ressortIndex}`, label: ressort } })),
).map(({ label, ressort }, index) =>
  VACANT_COURTS.has(index)
    ? {
        court: { id: `${index}`, label },
        installationDate: null,
        magistrat: null,
        ressort,
        status: STATUSES[2],
      }
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
        ressort,
        status: STATUSES[index % 8 === 5 ? 1 : 0],
      },
);

const courtsHandler = http.get('*/api/veille-des-postes/v1/tribunaux-judiciaires', ({ request }) => {
  const params = new URL(request.url).searchParams;
  const ressorts = params.getAll('ressorts');
  const statuses = params.getAll('statuses');
  const search = params.get('search')?.toLowerCase();
  const page = Number(params.get('page') ?? 1);
  const limit = Number(params.get('limit') ?? 20);

  const searched = JUDICIAL_COURTS.filter(
    (court) =>
      !search ||
      `${court.ressort.label} ${court.court.label} ${court.magistrat?.name}`.toLowerCase().includes(search),
  );
  const ofRessorts = (court: JudicialCourt) => ressorts.length === 0 || ressorts.includes(court.ressort.id);
  const ofStatuses = (court: JudicialCourt) => statuses.length === 0 || statuses.includes(court.status.id);
  const matching = searched.filter((court) => ofRessorts(court) && ofStatuses(court));

  return HttpResponse.json<ListedJudicialCourtPresidentsDto>({
    currentPageIndex: page,
    items: matching.slice((page - 1) * limit, page * limit),
    nextPageIndex: page * limit < matching.length ? page + 1 : undefined,
    ressorts: RESSORTS.map(([label], index) => ({
      count: searched.filter((court) => court.ressort.id === `ressort-${index}` && ofStatuses(court)).length,
      id: `ressort-${index}`,
      label,
    })),
    statuses: STATUSES.map((status) => ({
      ...status,
      count: searched.filter((court) => court.status.id === status.id && ofRessorts(court)).length,
    })),
    totalCount: matching.length,
  });
});

function JudicialCourtPresidentsStory() {
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
        <JudicialCourtPresidentsTable filtersSlot={filtersSlot} titleSlot={titleSlot} />
      </PinnedHeader>
    </StoryQueryClient>
  );
}

const meta = {
  beforeEach: ({ msw }) => {
    msw.use(courtsHandler);
  },
  component: JudicialCourtPresidentsStory,
  parameters: {
    docs: {
      description: {
        component:
          'Une ligne par tribunal judiciaire, par ressort puis par juridiction, avec son président. Un trait bleu marque le passage à un autre ressort. Un tribunal sans président est "Vacant". La recherche porte sur le ressort, la juridiction et le magistrat. Les filtres "Ressort" et "Alerte / statut" donnent le nombre de tribunaux de chaque valeur. En défilant, l\'en-tête se colle en haut et le compteur des lignes vues apparaît à côté du titre, par pages de 20. Les desiderata et les candidats arriveront avec leurs tickets.',
      },
    },
    layout: 'fullscreen',
  },
  title: 'Session/CSM/JudicialCourtPresidentsTable',
} satisfies Meta<typeof JudicialCourtPresidentsStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
