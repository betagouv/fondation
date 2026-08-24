import type { Meta, StoryObj } from '@storybook/react-vite';

import { ExpandableText } from './ExpandableText';

const longText = `Magistrate expérimentée, elle a exercé pendant douze ans au sein du tribunal judiciaire de Bordeaux avant de rejoindre la cour d'appel de Lyon.
Ses évaluations soulignent une grande rigueur juridique, une capacité d'écoute remarquable et un réel talent pour la conduite des audiences complexes.
Elle a par ailleurs piloté plusieurs chantiers de modernisation, dont la dématérialisation des procédures civiles et encadré de nombreux auditeurs de justice.
Sa candidature s'inscrit dans un projet de mobilité cohérent avec son parcours et les besoins de la juridiction d'accueil.`;

const meta = {
  title: 'Shared/ExpandableText',
  component: ExpandableText,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    className: { table: { disable: true } },
    lines: { control: { type: 'number', min: 1 } },
  },
  args: {
    lines: 3,
    text: longText,
  },
} satisfies Meta<typeof ExpandableText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
