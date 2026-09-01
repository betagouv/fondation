import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, ReactNode } from 'react';
import { fn } from 'storybook/test';

import { ACTION_ICONS } from '@/constants/icons.constants';

import { IconButton } from './IconButton';

function Row(props: { children: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-56 text-sm text-(--text-mention-grey)">{props.label}</span>
      {props.children}
    </div>
  );
}

const BUTTONS: (ComponentProps<typeof IconButton> & { title: string })[] = [
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
  title: 'Shared/IconButton',
  component: IconButton,
  argTypes: {
    iconId: { control: 'select', options: Object.values(ACTION_ICONS) },
  },
  parameters: {
    controls: { include: ['disabled', 'iconId', 'label', 'small'] },
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    disabled: false,
    iconId: ACTION_ICONS.download,
    label: 'Télécharger',
    onClick: fn(),
    small: true,
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Buttons: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {BUTTONS.map(({ title, ...button }) => (
        <Row key={title} label={title}>
          <IconButton {...button} onClick={fn()} small />
          <IconButton {...button} onClick={fn()} />
        </Row>
      ))}
    </div>
  ),
};
