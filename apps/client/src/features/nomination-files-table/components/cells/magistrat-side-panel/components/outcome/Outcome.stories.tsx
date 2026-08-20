import type { Meta, StoryObj } from '@storybook/react-vite';
import { useQuery } from '@tanstack/react-query';

import { NominationFileOutcomeCommentModalProvider } from '../../../nomination-file-outcome/NominationFileOutcomeCommentModalProvider';
import { NominationFilesTableProvider } from '@/features/nomination-files-table/context/NominationFilesTableProvider';
import { authHandlers } from '@/shared/storybook/msw.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';
import { FormationEnum, NominationFileOutcomeEnum } from '@/types/enums.types';
import { sessionKeys, type SessionNominationFile } from '@queries/nomination-sessions.queries';

import { Outcome } from './Outcome';

const SESSION_ID = 'session-1';

const outcomes = Object.values(NominationFileOutcomeEnum);

function SeededOutcome(props: { nominationFile: SessionNominationFile }) {
  const { data } = useQuery({
    queryFn: () => ({ items: [props.nominationFile] }),
    queryKey: sessionKeys.listSessionNominationFiles({ sessionId: SESSION_ID }),
    staleTime: Infinity,
  });

  const nominationFile = data?.items[0];
  if (!nominationFile) return null;

  return <Outcome nominationFile={nominationFile} />;
}

function OutcomeStory(props: {
  comment: string | null;
  formation: FormationEnum;
  outcome: NominationFileOutcomeEnum | null;
}) {
  const sessionOutcomes = makeSessionOutcomes(props.formation);
  const nominationFile = makeSessionNominationFile({
    content: { outcome: props.outcome ? { comment: props.comment, value: props.outcome } : null },
  });

  return (
    <StoryQueryClient key={`${props.comment}-${props.formation}-${props.outcome}`}>
      <NominationFilesTableProvider
        formation={props.formation}
        outcomes={sessionOutcomes}
        sessionId={SESSION_ID}
      >
        <NominationFileOutcomeCommentModalProvider>
          <SeededOutcome nominationFile={nominationFile} />
        </NominationFileOutcomeCommentModalProvider>
      </NominationFilesTableProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/MagistratSidePanel/Outcome',
  component: OutcomeStory,
  beforeEach: ({ msw }) => {
    msw.use(...authHandlers);
  },
  parameters: {
    layout: 'padded',
    router: { initialEntries: [`/secretariat-general/session/${SESSION_ID}`] },
  },
  tags: ['autodocs'],
  argTypes: {
    comment: { control: 'text' },
    formation: { control: 'inline-radio', options: Object.values(FormationEnum) },
    outcome: { control: 'select', options: [null, ...outcomes] },
  },
  args: {
    comment: 'Profil conforme aux attentes de la formation.',
    formation: FormationEnum.SIEGE,
    outcome: NominationFileOutcomeEnum.VALIDATED,
  },
} satisfies Meta<typeof OutcomeStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithoutComment: Story = {
  args: { comment: null, outcome: NominationFileOutcomeEnum.NON_VALIDATED },
};

export const NotDefined: Story = { args: { comment: null, outcome: null } };
