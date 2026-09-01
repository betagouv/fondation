import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, ReactNode } from 'react';

import { ACTION_ICONS } from '@/constants/icons.constants';
import type { IconClassName } from '@/types/icons.types';

import { IconLink } from './IconLink';

const LINK_ICONS: IconClassName[] = [
  'fr-icon-account-circle-line',
  'fr-icon-external-link-line',
  ...Object.values(ACTION_ICONS),
];

function Row(props: { children: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-56 text-sm text-(--text-mention-grey)">{props.label}</span>
      {props.children}
    </div>
  );
}

const meta = {
  title: 'Shared/IconLink',
  component: IconLink,
  argTypes: {
    iconId: { control: 'select', options: LINK_ICONS },
  },
  parameters: {
    controls: { include: ['disabled', 'iconId', 'label', 'newTab', 'small'] },
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    disabled: false,
    iconId: 'fr-icon-account-circle-line',
    label: 'Vers la fiche magistrat',
    newTab: false,
    small: true,
    to: '/magistrats/1',
  },
} satisfies Meta<typeof IconLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const LINKS: (ComponentProps<typeof IconLink> & { title: string })[] = [
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
    label: "Modifier les propositions de l'ordre du jour",
    title: "Propositions de l'ordre du jour",
    to: '/agendas/1/propositions',
  },
  {
    iconId: ACTION_ICONS.agendaMetadata,
    label: "Modifier les métadonnées de l'ordre du jour",
    title: "Métadonnées de l'ordre du jour",
    to: '/agendas/1/metadonnees',
  },
];

export const Links: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {LINKS.map(({ title, ...link }) => (
        <Row key={title} label={title}>
          <IconLink {...link} small />
          <IconLink {...link} />
        </Row>
      ))}
    </div>
  ),
};
