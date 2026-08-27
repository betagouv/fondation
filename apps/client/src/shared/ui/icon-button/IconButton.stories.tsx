import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { fn } from 'storybook/test';

import { ACTION_ICONS } from '@/constants/icons.constants';

import { IconButton, IconLink } from './IconButton';

function Row(props: { children: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-56 text-sm text-(--text-mention-grey)">{props.label}</span>
      {props.children}
    </div>
  );
}

const ACTIONS = [
  { iconId: ACTION_ICONS.download, label: 'Télécharger' },
  { iconId: ACTION_ICONS.edit, label: 'Modifier' },
  { iconId: ACTION_ICONS.delete, label: 'Supprimer' },
  { iconId: ACTION_ICONS.agendaFiles, label: "Propositions de l'ordre du jour" },
  { iconId: ACTION_ICONS.agendaMetadata, label: "Métadonnées de l'ordre du jour" },
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

export const ActionIcons: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {ACTIONS.map((action) => (
        <Row key={action.iconId} label={action.label}>
          <IconButton iconId={action.iconId} label={action.label} small />
        </Row>
      ))}
    </div>
  ),
};

export const Links: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      <Row label="Modifier">
        <IconLink iconId={ACTION_ICONS.edit} label="Modifier le document" to="/documents/1" />
      </Row>
      <Row label="Modifier en petit">
        <IconLink iconId={ACTION_ICONS.edit} label="Modifier le document" small to="/documents/1" />
      </Row>
      <Row label="Modifier sans en avoir le droit">
        <IconLink disabled iconId={ACTION_ICONS.edit} label="Modifier le document" small to="/documents/1" />
      </Row>
      <Row label="Ouvrir LOLFI en nouvel onglet">
        <IconLink
          iconId="fr-icon-external-link-line"
          label="Vers LOLFI"
          newTab
          small
          to="https://lolfi.example.fr/magistrat/1"
        />
      </Row>
    </div>
  ),
};
