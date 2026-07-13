import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { ObservationsModalProvider } from '../../../observations/context/ObservationsModalProvider';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { observationKeys, type Observation } from '@queries/observations.queries';

import { MagistratObservationsInbox } from './MagistratObservationsInbox';

const SESSION_ID = 'session-1';
const NOMINATION_FILE_ID = 'nomination-file';

const OBSERVERS = ['Syndicat de la magistrature', 'Union syndicale des magistrats'];

const LONG_DESCRIPTION = [
  "Je souhaite appeler l'attention du Conseil sur la charge actuelle de la juridiction et sur les conséquences de cette proposition pour le service civil, dont l'effectif est contraint depuis la transparence précédente.",
  "Deux postes de juge sont vacants depuis dix-huit mois, et le départ envisagé priverait le tribunal du seul magistrat formé au contentieux de la protection. Les délais d'audiencement, déjà supérieurs à la moyenne du ressort, s'en trouveraient mécaniquement dégradés.",
  "Je précise enfin que la proposition ne mentionne ni les fonctions exercées par intérim depuis janvier, ni l'expérience acquise à la chambre commerciale, qui me paraissent pourtant déterminantes pour apprécier la candidature concurrente.",
].join('\n\n');

const MAGISTRAT_MARTIN = {
  currentPosition: 'Juge au tribunal judiciaire de Nantes',
  firstName: 'Léa',
  id: 'magistrat-1',
  lastName: 'Martin',
  usedName: null,
};

const MAGISTRAT_DUPONT = {
  currentPosition: 'Procureur de la République adjoint près le tribunal judiciaire de Rennes',
  firstName: 'Marc',
  id: 'magistrat-2',
  lastName: 'Dupont',
  usedName: null,
};

const MAGISTRAT_BERNARD = {
  currentPosition: null,
  firstName: 'Claire',
  id: 'magistrat-3',
  lastName: 'Bernard',
  usedName: null,
};

const MAGISTRAT_LONG_NAME = {
  currentPosition:
    "Première vice-présidente chargée de l'instruction au tribunal judiciaire de Saint-Denis de la Réunion",
  firstName: 'Marie-Charlotte',
  id: 'magistrat-4',
  lastName: 'de La Rochefoucauld-Montbrison',
  usedName: null,
};

const ANNE_ROY = { firstName: 'Anne', id: 'user-1', lastName: 'Roy' };

const LONG_TEXT_WITH_ATTACHMENTS: Observation = {
  createdAt: '2026-07-13',
  createdBy: ANNE_ROY,
  dateReception: '2026-07-02',
  description: LONG_DESCRIPTION,
  files: [
    { id: 'file-1', name: 'observation-martin.pdf' },
    { id: 'file-2', name: 'note-charge-juridiction.docx' },
  ],
  followUp: 'REFERENCE',
  id: 'observation-1',
  magistrat: MAGISTRAT_MARTIN,
};

const LONG_TEXT_WITHOUT_ATTACHMENT: Observation = {
  createdAt: '2026-07-13',
  createdBy: ANNE_ROY,
  dateReception: '2026-07-05',
  description: LONG_DESCRIPTION,
  files: [],
  followUp: 'ALERT',
  id: 'observation-2',
  magistrat: MAGISTRAT_DUPONT,
};

const ATTACHMENT_WITHOUT_TEXT: Observation = {
  createdAt: '2026-07-13',
  createdBy: ANNE_ROY,
  dateReception: '2026-07-09',
  description: '',
  files: [{ id: 'file-3', name: 'courrier-bernard.pdf' }],
  followUp: 'INTERESTING',
  id: 'observation-3',
  magistrat: MAGISTRAT_BERNARD,
};

const SHORT_TEXT: Observation = {
  createdAt: '2026-07-14',
  createdBy: ANNE_ROY,
  dateReception: '2026-07-12',
  description: 'Observation transmise par un magistrat concurrent.',
  files: [],
  followUp: null,
  id: 'observation-4',
  magistrat: MAGISTRAT_MARTIN,
};

const LONG_NAME: Observation = {
  createdAt: '2026-07-14',
  createdBy: ANNE_ROY,
  dateReception: '2026-07-11',
  description: 'Observation transmise par une magistrate au nom particulièrement long.',
  files: [],
  followUp: 'INTERESTING',
  id: 'observation-6',
  magistrat: MAGISTRAT_LONG_NAME,
};

const NO_CONTENT: Observation = {
  createdAt: '2026-07-14',
  createdBy: null,
  dateReception: '2026-07-14',
  description: '',
  files: [],
  followUp: null,
  id: 'observation-5',
  magistrat: null,
};

const OBSERVATIONS = [
  LONG_TEXT_WITH_ATTACHMENTS,
  LONG_TEXT_WITHOUT_ATTACHMENT,
  ATTACHMENT_WITHOUT_TEXT,
  SHORT_TEXT,
  LONG_NAME,
  NO_CONTENT,
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

function MagistratObservationsInboxStory(props: {
  observations: Observation[];
  observers: number;
  view: View;
}) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(props.view === 'sg' ? ROUTE_PATHS.SG.DASHBOARD : ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
  }, [props.view, navigate]);

  const nominationFile = makeSessionNominationFile({
    id: NOMINATION_FILE_ID,
    content: { observants: props.observers > 0 ? OBSERVERS.slice(0, props.observers) : null },
  });

  return (
    <StoryQueryClient key={props.observations.map(({ id }) => id).join('-')} seed={seed(props.observations)}>
      <ObservationsModalProvider>
        <MagistratObservationsInbox nominationFile={nominationFile} sessionId={SESSION_ID} />
      </ObservationsModalProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/Magistrat/MagistratObservationsInbox',
  component: MagistratObservationsInboxStory,
  parameters: { layout: 'padded' },
  argTypes: {
    observations: { control: false },
    observers: { control: { type: 'range', min: 0, max: OBSERVERS.length, step: 1 } },
    view: { control: 'inline-radio', options: VIEWS },
  },
  args: { observations: OBSERVATIONS, observers: 1, view: 'sg' },
} satisfies Meta<typeof MagistratObservationsInboxStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SgView: Story = {};

export const MemberView: Story = { args: { view: 'member' } };

export const LongText: Story = { args: { observations: [LONG_TEXT_WITH_ATTACHMENTS] } };

export const LongTextWithoutAttachment: Story = { args: { observations: [LONG_TEXT_WITHOUT_ATTACHMENT] } };

export const AttachmentWithoutText: Story = { args: { observations: [ATTACHMENT_WITHOUT_TEXT] } };

export const NoContent: Story = { args: { observations: [NO_CONTENT] } };

export const StableHeight: Story = {
  args: { observations: [LONG_TEXT_WITH_ATTACHMENTS, NO_CONTENT, SHORT_TEXT] },
};

export const LongObserverName: Story = { args: { observations: [LONG_NAME, SHORT_TEXT] } };

export const Empty: Story = { args: { observations: [], observers: 0 } };
