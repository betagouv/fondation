import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { fn } from 'storybook/test';

import { ACTION_ICONS } from '@/shared/ui/icons';

import { IconButton } from './IconButton';

const USAGES: (ComponentProps<typeof IconButton> & { title: string })[] = [
  {
    iconId: ACTION_ICONS.download,
    label: 'Télécharger la pièce jointe',
    title: 'Télécharger une pièce jointe',
  },
  {
    disabled: true,
    iconId: ACTION_ICONS.download,
    label: 'Télécharger la pièce jointe',
    title: 'Télécharger pendant un téléchargement en cours',
  },
  {
    iconId: ACTION_ICONS.delete,
    label: 'Supprimer le document',
    title: 'Supprimer un document ou un fichier',
  },
  {
    disabled: true,
    iconId: ACTION_ICONS.delete,
    label: 'Supprimer le document',
    title: 'Supprimer sans en avoir le droit',
  },
];

const meta = {
  args: {
    disabled: false,
    iconId: ACTION_ICONS.download,
    label: 'Télécharger',
    onClick: fn(),
    small: true,
  },
  argTypes: { iconId: { control: 'select', options: Object.values(ACTION_ICONS) } },
  component: IconButton,
  parameters: {
    controls: { include: ['disabled', 'iconId', 'label', 'small'] },
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Shared/IconButton',
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** every real use, small then normal size side by side */
export const Usages: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-4">
      {USAGES.map(({ title, ...button }) => (
        <div className="flex items-center gap-2" key={title}>
          <span className="w-72 text-sm text-(--text-mention-grey)">{title}</span>
          <IconButton {...button} onClick={args.onClick} small />
          <IconButton {...button} onClick={args.onClick} />
        </div>
      ))}
    </div>
  ),
};
