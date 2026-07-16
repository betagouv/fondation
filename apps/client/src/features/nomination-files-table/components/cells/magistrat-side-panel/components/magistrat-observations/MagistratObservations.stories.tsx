import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { ObservationsModalProvider } from '../../../observations/context/ObservationsModalProvider';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { ObservationFollowUpEnumLabels, type ObservationFollowupEnum } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { observationKeys, type Observation } from '@queries/observations.queries';

import { MagistratObservations } from './MagistratObservations';

const SESSION_ID = 'session-1';
const NOMINATION_FILE_ID = 'nomination-file';

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
];

const TEXT_ONLY: Observation[] = [
  makeObservation({ description: LONG_TEXT, id: 'texte-seul', magistrat: MAGISTRATS[4] }),
];

const ONE_FILE: Observation[] = [
  makeObservation({
    files: makeFiles(1),
    followUp: 'INTERESTING',
    id: 'une-piece',
    magistrat: MAGISTRATS[1],
  }),
];

const MANY_FILES: Observation[] = [
  makeObservation({
    description: LONG_TEXT,
    files: makeFiles(6),
    followUp: 'ALERT',
    id: 'plusieurs-pieces',
    magistrat: MAGISTRATS[5],
  }),
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

function seed(observations: Observation[]) {
  return (client: QueryClient) =>
    client.setQueryData(
      observationKeys.observations({ sessionId: SESSION_ID, nominationFileId: NOMINATION_FILE_ID }),
      { observations },
    );
}

function MagistratObservationsStory(props: {
  observers: number;
  observations: boolean;
  view: View;
  followUp?: FollowUpControl;
  data?: Observation[];
}) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(props.view === 'sg' ? ROUTE_PATHS.SG.DASHBOARD : ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
  }, [props.view, navigate]);

  const { followUp } = props;
  const base = props.data ?? (props.observations ? OBSERVATIONS : []);
  const observations = followUp
    ? base.map((observation) => ({
        ...observation,
        followUp: followUp === NO_TAG ? null : followUp,
      }))
    : base;
  const nominationFile = makeSessionNominationFile({
    id: NOMINATION_FILE_ID,
    content: { observants: props.observers > 0 ? OBSERVERS.slice(0, props.observers) : null },
  });

  return (
    <StoryQueryClient key={`${observations.length}-${followUp ?? 'none'}`} seed={seed(observations)}>
      <ObservationsModalProvider>
        <MagistratObservations nominationFile={nominationFile} sessionId={SESSION_ID} />
      </ObservationsModalProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/Magistrat/MagistratObservations',
  component: MagistratObservationsStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    observers: { control: { type: 'range', min: 0, max: OBSERVERS.length, step: 1 } },
    observations: { control: 'boolean' },
    view: { control: 'inline-radio', options: VIEWS },
    followUp: {
      control: 'inline-radio',
      options: [NO_TAG, 'ALERT', 'INTERESTING', 'REFERENCE'] satisfies FollowUpControl[],
      labels: { [NO_TAG]: 'Aucun', ...ObservationFollowUpEnumLabels },
    },
    data: { control: false },
  },
  args: { observers: 1, observations: true, view: 'sg' },
} satisfies Meta<typeof MagistratObservationsStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SecretaireGeneral: Story = {};

export const Membre: Story = { args: { view: 'member' } };

export const ObserversOnly: Story = { args: { observations: false } };

export const Empty: Story = { args: { observers: 0, observations: false } };

export const TexteSeul: Story = { args: { view: 'sg', data: TEXT_ONLY } };

export const UnePieceJointe: Story = { args: { view: 'sg', data: ONE_FILE } };

export const TexteEtPlusieursPiecesJointes: Story = { args: { view: 'sg', data: MANY_FILES } };

export const MembrePieceJointe: Story = { args: { view: 'member', data: ONE_FILE } };

export const Qualifications: Story = { args: { view: 'sg', data: QUALIFIED_OBSERVATIONS } };

export const SansTag: Story = { args: { view: 'sg', followUp: NO_TAG } };
