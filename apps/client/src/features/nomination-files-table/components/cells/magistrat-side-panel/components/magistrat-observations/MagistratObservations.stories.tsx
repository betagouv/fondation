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

const OBSERVATIONS: Observation[] = [
  {
    createdAt: '2026-03-11',
    createdBy: { firstName: 'Anne', id: 'user-1', lastName: 'Roy' },
    dateReception: '2026-03-10',
    description: 'Observation transmise par un magistrat concurrent.',
    files: [{ id: 'file-1', name: 'observation-martin.pdf' }],
    followUp: 'REFERENCE',
    id: 'observation-1',
    magistrat: {
      currentPosition: 'Juge au tribunal judiciaire de Nantes',
      firstName: 'Léa',
      id: 'magistrat-1',
      lastName: 'Martin',
      usedName: null,
    },
  },
  {
    createdAt: '2026-03-14',
    createdBy: null,
    dateReception: '2026-03-14',
    description: 'Observation sans pièce jointe.',
    files: [],
    followUp: null,
    id: 'observation-2',
    magistrat: null,
  },
];

const QUALIFIED_OBSERVATIONS: Observation[] = (['ALERT', 'INTERESTING', 'REFERENCE'] as const).map(
  (followUp, index) => ({
    createdAt: '2026-03-11',
    createdBy: { firstName: 'Anne', id: 'user-1', lastName: 'Roy' },
    dateReception: '2026-03-10',
    description: 'Observation qualifiée.',
    files: [],
    followUp,
    id: `observation-qualified-${index}`,
    magistrat: {
      currentPosition: 'Juge au tribunal judiciaire de Nantes',
      firstName: 'Léa',
      id: `magistrat-${index}`,
      lastName: 'Martin',
      usedName: null,
    },
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

export const Qualifications: Story = { args: { view: 'sg', data: QUALIFIED_OBSERVATIONS } };
