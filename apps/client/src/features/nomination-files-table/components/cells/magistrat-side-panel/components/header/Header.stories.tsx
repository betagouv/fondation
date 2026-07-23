import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { NominationFilesTableProvider } from '@/features/nomination-files-table/context/NominationFilesTableProvider';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';
import { FormationEnum, PrioriteEnum } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { authKeys } from '@queries/auth.queries';
import { memberKeys } from '@queries/members.queries';

import { Header } from './Header';

const SESSION_ID = 'session-1';
const CURRENT_USER_ID = 'current-user';

const priorities = Object.values(PrioriteEnum);

const REPORTER_SCENARIOS = ['none', 'others', 'you'] as const;
type ReporterScenario = (typeof REPORTER_SCENARIOS)[number];

const OTHER_REPORTERS = [
  { firstName: 'Marie', id: 'reporter-1', lastName: 'Lefevre' },
  { firstName: 'Paul', id: 'reporter-2', lastName: 'Moreau' },
];

const AVAILABLE_MEMBERS = [
  { firstName: 'Jean', id: CURRENT_USER_ID, lastName: 'Petit' },
  ...OTHER_REPORTERS,
  { firstName: 'Sophie', id: 'reporter-3', lastName: 'Bernard' },
];

function reportersFor(scenario: ReporterScenario) {
  if (scenario === 'none') return [];
  if (scenario === 'you')
    return [{ firstName: 'Jean', id: CURRENT_USER_ID, lastName: 'Petit' }, OTHER_REPORTERS[0]];
  return OTHER_REPORTERS;
}

function seedQueries(client: QueryClient) {
  client.setQueryData(authKeys.introspectSession(), {
    civility: 'Monsieur PETIT',
    firstName: 'Jean',
    id: CURRENT_USER_ID,
    isImpersonated: false,
    lastName: 'Petit',
    role: 'MEMBRE_DU_SIEGE',
  });

  const memberListOptions = {
    formations: ['COMMUN', FormationEnum.SIEGE],
    pagination: { pageIndex: 0, pageSize: 100 },
  };
  client.setQueryData(memberKeys.listMembers(memberListOptions), { items: AVAILABLE_MEMBERS });
}

const VIEWS = ['sg', 'sgArchived', 'member'] as const;
type View = (typeof VIEWS)[number];

function HeaderStory(props: {
  auditionScheduled?: boolean;
  nomMagistrat: string;
  priorities: PrioriteEnum[];
  reporters: ReporterScenario;
  view: View;
}) {
  const isSg = props.view !== 'member';
  const isEditable = props.view === 'sg';

  const navigate = useNavigate();
  useEffect(() => {
    navigate(isSg ? ROUTE_PATHS.SG.DASHBOARD : ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
  }, [isSg, navigate]);

  const nominationFile = makeSessionNominationFile({
    auditionDate: props.auditionScheduled ? { year: 2026, month: 9, day: 15 } : null,
    auditionTime: props.auditionScheduled ? { hours: 14, minutes: 30, seconds: 0 } : null,
    content: { nomMagistrat: props.nomMagistrat },
    priorities: props.priorities,
    reporters: reportersFor(props.reporters),
  });

  return (
    <StoryQueryClient seed={seedQueries}>
      <NominationFilesTableProvider
        formation={FormationEnum.SIEGE}
        isEditable={isEditable}
        outcomes={makeSessionOutcomes(FormationEnum.SIEGE)}
        sessionId={SESSION_ID}
      >
        <Header nominationFile={nominationFile} sessionId={SESSION_ID} />
      </NominationFilesTableProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/SidePanel/Header',
  component: HeaderStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    nomMagistrat: { control: 'text' },
    priorities: { control: 'check', options: priorities },
    reporters: { control: 'inline-radio', options: REPORTER_SCENARIOS },
    view: { control: 'inline-radio', options: VIEWS },
  },
  args: {
    auditionScheduled: true,
    nomMagistrat: 'Camille DURAND',
    priorities: [PrioriteEnum.ETOILE],
    reporters: 'you',
    view: 'sg',
  },
} satisfies Meta<typeof HeaderStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SecretaireGeneral: Story = {
  args: { priorities: [PrioriteEnum.ETOILE, PrioriteEnum.OUTRE_MER], reporters: 'others', view: 'sg' },
};

export const Membre: Story = {
  args: { priorities: [], reporters: 'you', view: 'member' },
};
