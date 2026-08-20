import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ACTION_ICONS } from '@/constants/icons.constants';

import { IconButton } from './IconButton';

function ActionBar() {
  return (
    <div className="-ml-2 flex items-center gap-1">
      {Object.entries(ACTION_ICONS).map(([name, iconId]) => (
        <IconButton iconId={iconId} key={name} label={name} />
      ))}
    </div>
  );
}

const meta = {
  title: 'Shared/IconButton',
  component: IconButton,
  argTypes: {
    iconId: { control: 'select', options: Object.values(ACTION_ICONS) },
  },
  parameters: {
    controls: { include: ['disabled', 'iconId', 'label'] },
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: { disabled: false, iconId: ACTION_ICONS.download, label: 'Télécharger', onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ActionIcons: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ActionBar />,
};
