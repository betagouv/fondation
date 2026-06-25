import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { ObservationsModalProvider } from '../../../observations/context/ObservationsModalProvider';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
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
    id: 'observation-2',
    magistrat: null,
  },
];

const VIEWS = ['sg', 'member'] as const;
type View = (typeof VIEWS)[number];

function seed(observations: Observation[]) {
  return (client: QueryClient) =>
    client.setQueryData(
      observationKeys.observations({ sessionId: SESSION_ID, nominationFileId: NOMINATION_FILE_ID }),
      { observations },
    );
}

function MagistratObservationsStory(props: { observers: boolean; observations: boolean; view: View }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(props.view === 'sg' ? ROUTE_PATHS.SG.DASHBOARD : ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
  }, [props.view, navigate]);

  const observations = props.observations ? OBSERVATIONS : [];
  const nominationFile = makeSessionNominationFile({
    id: NOMINATION_FILE_ID,
    content: { observants: props.observers ? OBSERVERS : null },
  });

  return (
    <StoryQueryClient key={`${observations.length}`} seed={seed(observations)}>
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
    observers: { control: 'boolean' },
    observations: { control: 'boolean' },
    view: { control: 'inline-radio', options: VIEWS },
  },
  args: { observers: true, observations: true, view: 'sg' },
} satisfies Meta<typeof MagistratObservationsStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SecretaireGeneral: Story = {};

export const Membre: Story = { args: { view: 'member' } };

export const ObserversOnly: Story = { args: { observations: false } };

export const Empty: Story = { args: { observers: false, observations: false } };
