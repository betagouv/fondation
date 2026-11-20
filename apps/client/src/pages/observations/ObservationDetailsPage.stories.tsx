import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { ObservationFollowUpEnum } from '@/shared/enums/observation-follow-up.enum';
import { PageStory } from '@/shared/storybook/PageStory';
import { STORY_AUTHORS, STORY_VIEWS, type StoryView } from '@/shared/storybook/story-users';
import { getObservationDetailsPath, ROUTE_PATHS } from '@/utils/route-path.utils';
import type { GetObservationDetailsResponseDto } from '@api/types';

import { ObservationDetailsPage } from './ObservationDetailsPage';

const OBSERVATION: GetObservationDetailsResponseDto = {
  canComment: false,
  canEdit: true,
  canManageAttachments: true,
  description:
    'Le magistrat observant souligne avoir exercé les mêmes fonctions pendant six ans et demande que son ancienneté soit prise en compte.',
  files: [
    {
      addedAt: '2026-03-11T08:30:00.000Z',
      addedBy: STORY_AUTHORS.sg,
      id: 'observation-file-1',
      name: 'courrier-observation.pdf',
      size: 120_000,
    },
  ],
  followUp: 'INTERESTING',
  followUpComment: 'À rapprocher du dossier n°14.',
  id: 'observation-1',
  isArchived: false,
  memberComment: {
    comment: '<p>Argument recevable, à vérifier avec la DSJ.</p>',
    screenshots: [],
    visibility: 'VISIBLE',
  },
  observant: {
    audition: null,
    auditionScheduling: 'SCHEDULABLE',
    biography:
      '- Juge au tribunal judiciaire de Nantes (2014) - Vice-président au tribunal judiciaire de Nantes (2020)',
    externalUrl: 'https://lolfi.example.fr/magistrat/2',
    id: 'magistrat-2',
    name: 'LEROY Paul',
  },
  observedMagistrat: {
    detectedMagistratId: 'magistrat-1',
    name: 'DURAND Camille',
    proposedPosition: 'Présidente de chambre à la cour d’appel de Paris',
  },
  receptionDate: { day: 10, month: 3, year: 2026 },
  relatedPropositions: [
    {
      magistratName: 'MARTIN Léa',
      nominationFileId: 'nomination-file-14',
      number: 14,
      observationDate: { day: 10, month: 3, year: 2026 },
      observationId: 'observation-2',
      proposedPosition: 'Conseillère à la cour d’appel de Paris',
    },
  ],
};

const IMPERSONATED = { canComment: false, memberComment: { visibility: 'PRIVATE' } } as const;

const PATHS = {
  member: ROUTE_PATHS.TRANSPARENCES.OBSERVATION_DETAILS,
  sg: ROUTE_PATHS.SG.GDS.OBSERVATION_DETAILS,
} satisfies Record<StoryView, string>;

function ObservationDetailsPageStory(props: {
  followUp: ObservationFollowUpEnum | null;
  isImpersonated: boolean;
  view: StoryView;
}) {
  const view = props.isImpersonated ? 'member' : props.view;

  return (
    <PageStory
      location={getObservationDetailsPath({
        context: view === 'sg' ? 'sg' : 'membre',
        nominationFileId: 'nomination-file-1',
        observationId: OBSERVATION.id,
        sessionId: 'session-1',
      })}
      path={PATHS[view]}
      view={view}
    >
      <ObservationDetailsPage />
    </PageStory>
  );
}

const meta = {
  args: { followUp: OBSERVATION.followUp, isImpersonated: false, view: 'sg' },
  argTypes: {
    followUp: {
      control: 'inline-radio',
      mapping: { aucune: null },
      options: ['aucune', ...Object.values(ObservationFollowUpEnum)],
    },
    isImpersonated: {
      control: 'boolean',
      description:
        'an admin acting as the member, in the member view: the comment of the member stays private',
    },
    view: { control: 'inline-radio', options: STORY_VIEWS },
  },
  beforeEach: ({ args, msw }) => {
    const view = args.isImpersonated ? 'member' : args.view;
    msw.use(
      http.get('*/api/sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId', () =>
        HttpResponse.json<GetObservationDetailsResponseDto>({
          ...OBSERVATION,
          canComment: view !== 'sg',
          canEdit: view === 'sg',
          canManageAttachments: view === 'sg',
          followUp: args.followUp,
          followUpComment: view === 'sg' && args.followUp ? OBSERVATION.followUpComment : null,
          ...(args.isImpersonated ? IMPERSONATED : {}),
        }),
      ),
    );
  },
  component: ObservationDetailsPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Details/Observation',
} satisfies Meta<typeof ObservationDetailsPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
