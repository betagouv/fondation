import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

import { ACTION_ICONS, type IconClassName } from '@/shared/ui/icons';

import { IconLink } from './IconLink';

const LINK_ICONS: IconClassName[] = [
  'fr-icon-account-circle-line',
  'fr-icon-external-link-line',
  ...Object.values(ACTION_ICONS),
];

const USAGES: (ComponentProps<typeof IconLink> & { title: string })[] = [
  {
    iconId: 'fr-icon-account-circle-line',
    label: 'Vers la fiche magistrat',
    title: 'Fiche magistrat',
    to: '/magistrats/1',
  },
  {
    iconId: 'fr-icon-external-link-line',
    label: 'Vers LOLFI',
    newTab: true,
    title: 'LOLFI en nouvel onglet',
    to: 'https://lolfi.example.fr/magistrat/1',
  },
  {
    iconId: ACTION_ICONS.edit,
    label: 'Modifier le document',
    title: 'Modifier un document',
    to: '/documents/1',
  },
  {
    disabled: true,
    iconId: ACTION_ICONS.edit,
    label: 'Modifier le document',
    title: 'Modifier sans en avoir le droit',
    to: '/documents/1',
  },
  {
    iconId: ACTION_ICONS.agendaFiles,
    label: "Sélectionner les propositions de l'ordre du jour",
    title: "Propositions de l'ordre du jour",
    to: '/agendas/1/propositions',
  },
  {
    iconId: ACTION_ICONS.agendaMetadata,
    label: "Éditer les métadonnées de l'ordre du jour",
    title: "Informations de l'ordre du jour",
    to: '/agendas/1/metadonnees',
  },
];

const meta = {
  args: {
    disabled: false,
    iconId: 'fr-icon-account-circle-line',
    label: 'Vers la fiche magistrat',
    newTab: false,
    small: true,
    to: '/magistrats/1',
  },
  argTypes: { iconId: { control: 'select', options: LINK_ICONS } },
  component: IconLink,
  parameters: {
    controls: { include: ['disabled', 'iconId', 'label', 'newTab', 'small'] },
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Shared/IconLink',
} satisfies Meta<typeof IconLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** every real use, small then normal size side by side */
export const Usages: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {USAGES.map(({ title, ...link }) => (
        <div className="flex items-center gap-2" key={title}>
          <span className="w-72 text-sm text-(--text-mention-grey)">{title}</span>
          <IconLink {...link} small />
          <IconLink {...link} />
        </div>
      ))}
    </div>
  ),
};
