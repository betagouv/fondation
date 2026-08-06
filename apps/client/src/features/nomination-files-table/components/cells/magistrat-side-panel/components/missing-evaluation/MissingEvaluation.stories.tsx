import type { Meta, StoryObj } from '@storybook/react-vite';

import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';

import { MissingEvaluation } from './MissingEvaluation';

const SESSION_ID = 'session-1';

const SG_ROUTE = { initialEntries: [`/secretariat-general/session/${SESSION_ID}`] };

function MissingEvaluationStory(props: { isUpdatable: boolean; missingEvaluation: boolean }) {
  const nominationFile = makeSessionNominationFile({
    content: { isUpdatable: props.isUpdatable },
    missingEvaluation: props.missingEvaluation,
  });

  return (
    <StoryQueryClient>
      <MissingEvaluation
        key={`${props.isUpdatable}-${props.missingEvaluation}`}
        nominationFile={nominationFile}
        sessionId={SESSION_ID}
      />
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/SidePanel/MissingEvaluation',
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
