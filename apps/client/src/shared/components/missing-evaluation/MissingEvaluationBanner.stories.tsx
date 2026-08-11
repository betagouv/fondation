import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MissingEvaluationBanner } from './MissingEvaluationBanner';

function MissingEvaluationBannerStory(props: { missingEvaluation: boolean; withAction: boolean }) {
  return (
    <MissingEvaluationBanner className="rounded px-4 py-3" missingEvaluation={props.missingEvaluation}>
      {props.withAction && (
        <Button className="ml-auto underline" priority="tertiary no outline" size="small">
          Modifier
        </Button>
      )}
    </MissingEvaluationBanner>
  );
}

const meta = {
  title: 'Shared/MissingEvaluationBanner',
  component: MissingEvaluationBannerStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    missingEvaluation: { control: 'boolean' },
    withAction: { control: 'boolean' },
  },
  args: { missingEvaluation: true, withAction: false },
} satisfies Meta<typeof MissingEvaluationBannerStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Missing: Story = {};

export const WithAction: Story = { args: { withAction: true } };
