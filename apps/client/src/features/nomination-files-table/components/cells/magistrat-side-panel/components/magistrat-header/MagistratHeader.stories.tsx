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
import { reportKeys } from '@queries/reports.queries';

import { MagistratHeader } from './MagistratHeader';

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

function seedQueries(
  client: QueryClient,
  view: View,
  myReport: { nominationFileId: string; reportId: string | null },
) {
  client.setQueryData(
    reportKeys.myReport({ nominationFileId: myReport.nominationFileId }),
    myReport.reportId,
  );

  client.setQueryData(
    authKeys.introspectSession(),
    view === 'member'
      ? {
          civility: 'Monsieur PETIT',
          firstName: 'Jean',
          id: CURRENT_USER_ID,
          isImpersonated: false,
          lastName: 'Petit',
          role: 'MEMBRE_DU_SIEGE',
        }
      : {
          civility: 'Madame ROCHE',
          firstName: 'Anne',
          id: 'sg-user',
          isImpersonated: false,
          lastName: 'Roche',
          role: 'ADJOINT_SECRETAIRE_GENERAL',
        },
  );

  const memberListOptions = {
    formations: ['COMMUN', FormationEnum.SIEGE],
    pagination: { pageIndex: 0, pageSize: 100 },
  };
  client.setQueryData(memberKeys.listMembers(memberListOptions), { items: AVAILABLE_MEMBERS });
}

const VIEWS = ['sg', 'sgArchived', 'member'] as const;
type View = (typeof VIEWS)[number];

function MagistratHeaderStory(props: {
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

  const myReportId = props.view === 'member' && props.reporters === 'you' ? 'report-1' : null;

  return (
    <StoryQueryClient
      key={`${props.view}-${props.reporters}`}
      seed={(client) =>
        seedQueries(client, props.view, { nominationFileId: nominationFile.id, reportId: myReportId })
      }
    >
      <NominationFilesTableProvider
        formation={FormationEnum.SIEGE}
        isEditable={isEditable}
        outcomes={makeSessionOutcomes(FormationEnum.SIEGE)}
        sessionId={SESSION_ID}
      >
        <MagistratHeader nominationFile={nominationFile} sessionId={SESSION_ID} />
      </NominationFilesTableProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/Magistrat/MagistratHeader',
  component: MagistratHeaderStory,
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
    reporters: 'others',
    view: 'sg',
  },
} satisfies Meta<typeof MagistratHeaderStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SecretaireGeneral: Story = {
  args: { priorities: [PrioriteEnum.ETOILE, PrioriteEnum.OUTRE_MER], reporters: 'others', view: 'sg' },
};

export const Membre: Story = {
  args: { priorities: [], reporters: 'you', view: 'member' },
};
