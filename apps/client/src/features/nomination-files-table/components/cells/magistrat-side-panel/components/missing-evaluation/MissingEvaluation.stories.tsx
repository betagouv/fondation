import type { Meta, StoryObj } from '@storybook/react-vite';
import { useQuery } from '@tanstack/react-query';

import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { sessionKeys, type SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MissingEvaluation } from './MissingEvaluation';

const SESSION_ID = 'session-1';

const SG_ROUTE = { initialEntries: [`/secretariat-general/session/${SESSION_ID}`] };

function SeededMissingEvaluation(props: { nominationFile: SessionNominationFile }) {
  const { data } = useQuery({
    queryFn: () => ({ items: [props.nominationFile] }),
    queryKey: sessionKeys.listSessionNominationFiles({ sessionId: SESSION_ID }),
    staleTime: Infinity,
  });

  const nominationFile = data?.items[0];
  if (!nominationFile) return null;

  return <MissingEvaluation nominationFile={nominationFile} sessionId={SESSION_ID} />;
}

function MissingEvaluationStory(props: { isUpdatable: boolean; missingEvaluation: boolean }) {
  const nominationFile = makeSessionNominationFile({
    content: { isUpdatable: props.isUpdatable },
    missingEvaluation: props.missingEvaluation,
  });

  return (
    <StoryQueryClient key={`${props.isUpdatable}-${props.missingEvaluation}`}>
      <SeededMissingEvaluation nominationFile={nominationFile} />
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/MagistratSidePanel/MissingEvaluation',
  component: MissingEvaluationStory,
  parameters: { layout: 'padded', router: SG_ROUTE },
  tags: ['autodocs'],
  argTypes: {
    isUpdatable: { control: 'boolean' },
    missingEvaluation: { control: 'boolean' },
  },
  args: { isUpdatable: true, missingEvaluation: false },
} satisfies Meta<typeof MissingEvaluationStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
