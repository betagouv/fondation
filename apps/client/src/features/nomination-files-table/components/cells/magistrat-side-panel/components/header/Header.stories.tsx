import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { AuditionNotice } from '../audition-date/AuditionNotice';
import { MissingEvaluation } from '../missing-evaluation/MissingEvaluation';
import { NominationFilesTableProvider } from '@/features/nomination-files-table/context/NominationFilesTableProvider';
import { useSeededNominationFiles } from '@/shared/storybook/seeded-nomination-files';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';
import { FormationEnum, PrioriteEnum } from '@/types/enums.types';
import { isAuditionMissing } from '@/utils/audition-expectation.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { authKeys } from '@queries/auth.queries';
import { memberKeys, type ListMembersOptions } from '@queries/members.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { reportKeys } from '@queries/reports.queries';

import { Header } from './Header';

const SESSION_ID = 'session-1';
const CURRENT_USER_ID = 'current-user';

const priorities = Object.values(PrioriteEnum);

const REPORTER_SCENARIOS = ['none', 'others', 'you'] as const;
type ReporterScenario = (typeof REPORTER_SCENARIOS)[number];

const AUDITION_SCENARIOS = ['none', 'expected', 'scheduled', 'past'] as const;
type AuditionScenario = (typeof AUDITION_SCENARIOS)[number];

const AUDITIONED_POSITION = { auditionExpected: true, expectedReportersCount: 2 };
const SCHEDULED_AT = {
  auditionDate: { year: 2026, month: 9, day: 15 },
  auditionTime: { hours: 14, minutes: 30, seconds: 0 },
};
const HELD_AT = {
  auditionDate: { year: 2020, month: 1, day: 10 },
  auditionTime: { hours: 14, minutes: 30, seconds: 0 },
};

function auditionFor(scenario: AuditionScenario) {
  if (scenario === 'scheduled') return { ...AUDITIONED_POSITION, ...SCHEDULED_AT };
  if (scenario === 'past') return { ...AUDITIONED_POSITION, ...HELD_AT };
  if (scenario === 'expected') return { ...AUDITIONED_POSITION, auditionDate: null, auditionTime: null };

  return { auditionDate: null, auditionExpected: false, auditionTime: null, expectedReportersCount: null };
}

const OTHER_REPORTERS = [
  { firstName: 'Marie', id: 'reporter-1', lastName: 'Lefevre' },
  { firstName: 'Paul', id: 'reporter-2', lastName: 'Moreau' },
];

const LYON = { id: 'CA  LYON', label: "Cour d'appel de Lyon" };
const RENNES = { id: 'CA  RENNES', label: "Cour d'appel de Rennes" };

const EXCLUSION_SCENARIOS = [
  'none',
  'oneReporter',
  'sameJurisdiction',
  'distinctJurisdictions',
  'overlappingJurisdictions',
] as const;
type ExclusionScenario = (typeof EXCLUSION_SCENARIOS)[number];

const AVAILABLE_MEMBERS = [
  { firstName: 'Jean', id: CURRENT_USER_ID, lastName: 'Petit' },
  ...OTHER_REPORTERS,
  { firstName: 'Sophie', id: 'reporter-3', lastName: 'Bernard' },
].map((member) => ({ ...member, excludedJurisdictions: [] as (typeof LYON)[] }));

function exclusionsFor(scenario: ExclusionScenario): Record<string, (typeof LYON)[]> {
  if (scenario === 'oneReporter') return { [OTHER_REPORTERS[0].id]: [LYON] };
  if (scenario === 'sameJurisdiction')
    return { [OTHER_REPORTERS[0].id]: [LYON], [OTHER_REPORTERS[1].id]: [LYON] };
  if (scenario === 'distinctJurisdictions')
    return { [OTHER_REPORTERS[0].id]: [LYON], [OTHER_REPORTERS[1].id]: [RENNES] };
  if (scenario === 'overlappingJurisdictions')
    return { [OTHER_REPORTERS[0].id]: [LYON, RENNES], [OTHER_REPORTERS[1].id]: [LYON] };
  return {};
}

function membersFor(scenario: ExclusionScenario) {
  const exclusions = exclusionsFor(scenario);

  return AVAILABLE_MEMBERS.map((member) => ({
    ...member,
    excludedJurisdictions: exclusions[member.id] ?? member.excludedJurisdictions,
  }));
}

function jurisdictionsFor(scenario: ExclusionScenario) {
  if (scenario === 'none') return { current: null, targeted: null };
  if (scenario === 'distinctJurisdictions' || scenario === 'overlappingJurisdictions')
    return { current: LYON, targeted: RENNES };
  return { current: LYON, targeted: null };
}

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
  members: typeof AVAILABLE_MEMBERS,
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

  const memberListOptions: ListMembersOptions = {
    formations: ['COMMUN', FormationEnum.SIEGE],
    pagination: { pageIndex: 0, pageSize: 100 },
  };
  client.setQueryData(memberKeys.listMembers(memberListOptions), { items: members });
}

const VIEWS = ['sg', 'sgArchived', 'member'] as const;
type View = (typeof VIEWS)[number];

function HeaderNotices(props: { editable: boolean; nominationFile: SessionNominationFile }) {
  const [nominationFile = props.nominationFile] = useSeededNominationFiles({
    files: [props.nominationFile],
    sessionId: SESSION_ID,
  });

  return (
    <div className="flex flex-col gap-10">
      <Header nominationFile={nominationFile} sessionId={SESSION_ID} />
      <div className="-mt-10 [&>*+*]:border-t [&>*+*]:border-(--border-open-blue-france)">
        <AuditionNotice
          auditionDate={nominationFile.auditionDate}
          auditionMissing={isAuditionMissing(nominationFile)}
          auditionTime={nominationFile.auditionTime}
          editable={props.editable && nominationFile.canScheduleAudition}
        />
        <MissingEvaluation editable={props.editable} nominationFile={nominationFile} sessionId={SESSION_ID} />
      </div>
    </div>
  );
}

function HeaderStory(props: {
  audition: AuditionScenario;
  excludedJurisdiction?: ExclusionScenario;
  magistratName: string;
  missingEvaluation?: boolean;
  priorities: PrioriteEnum[];
  reporters: ReporterScenario;
  view: View;
}) {
  const isSg = props.view !== 'member';
  const canManage = props.view === 'sg';

  const navigate = useNavigate();
  useEffect(() => {
    navigate(isSg ? ROUTE_PATHS.SG.DASHBOARD : ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
  }, [isSg, navigate]);

  const nominationFile = makeSessionNominationFile({
    ...auditionFor(props.audition),
    content: {
      jurisdictions: jurisdictionsFor(props.excludedJurisdiction ?? 'none'),
      nomMagistrat: props.magistratName,
    },
    missingEvaluation: !!props.missingEvaluation,
    priorities: props.priorities,
    reporters: reportersFor(props.reporters),
  });

  const myReportId = props.view === 'member' && props.reporters === 'you' ? 'report-1' : null;

  return (
    <StoryQueryClient
      key={JSON.stringify(props)}
      seed={(client) =>
        seedQueries(
          client,
          props.view,
          { nominationFileId: nominationFile.id, reportId: myReportId },
          membersFor(props.excludedJurisdiction ?? 'none'),
        )
      }
    >
      <NominationFilesTableProvider
        canManage={canManage}
        formation={FormationEnum.SIEGE}
        outcomes={makeSessionOutcomes(FormationEnum.SIEGE)}
        sessionId={SESSION_ID}
      >
        <HeaderNotices editable={isSg} nominationFile={nominationFile} />
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
    audition: {
      control: 'inline-radio',
      description: 'expected, scheduled et past décrivent un poste auditionné, qui attend 2 rapporteurs',
      options: AUDITION_SCENARIOS,
    },
    excludedJurisdiction: { control: 'inline-radio', options: EXCLUSION_SCENARIOS },
    magistratName: { control: 'text' },
    missingEvaluation: { control: 'boolean' },
    priorities: { control: 'check', options: priorities },
    reporters: { control: 'inline-radio', options: REPORTER_SCENARIOS },
    view: { table: { disable: true } },
  },
  args: {
    audition: 'none',
    excludedJurisdiction: 'none',
    magistratName: 'Camille DURAND',
    missingEvaluation: false,
    priorities: [PrioriteEnum.ETOILE],
    reporters: 'others',
    view: 'sg',
  },
} satisfies Meta<typeof HeaderStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    audition: 'past',
    missingEvaluation: false,
    priorities: [PrioriteEnum.ETOILE, PrioriteEnum.OUTRE_MER],
    reporters: 'others',
    view: 'sg',
  },
  argTypes: {
    reporters: { control: 'inline-radio', options: ['none', 'others'] },
    view: { control: 'inline-radio', options: ['sg', 'sgArchived'], table: { disable: false } },
  },
};

export const Membre: Story = {
  args: { priorities: [], reporters: 'you', view: 'member' },
  argTypes: {
    excludedJurisdiction: { control: 'inline-radio', options: ['none', 'oneReporter'] },
  },
};
