import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tooltip } from './Tooltip';

function TooltipStory(props: { label: string }) {
  return (
    <div className="flex justify-center py-16">
      <Tooltip label={props.label}>
        <button className="fr-btn fr-btn--secondary fr-btn--sm" type="button">
          Survolez-moi
        </button>
      </Tooltip>
    </div>
  );
}

function ClippedTooltipStory(props: { label: string }) {
  return (
    <div className="relative overflow-auto border border-(--border-contrast-grey) p-4">
      <div className="flex justify-between">
        <Tooltip label={props.label}>
          <button className="fr-btn fr-btn--secondary fr-btn--sm" type="button">
            Bord gauche
          </button>
        </Tooltip>
        <Tooltip label={props.label}>
          <button className="fr-btn fr-btn--secondary fr-btn--sm" type="button">
            Bord droit
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

const meta = {
  title: 'Shared/Tooltip',
  component: TooltipStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: { label: { control: 'text' } },
  args: { label: 'Le profil ne correspond pas aux attentes de la formation pour ce poste.' },
} satisfies Meta<typeof TooltipStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShortText: Story = { args: { label: 'Évaluation manquante' } };

export const InsideClippingContainer: Story = { render: (args) => <ClippedTooltipStory {...args} /> };
