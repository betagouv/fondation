import type { Meta, StoryObj } from '@storybook/react-vite';

import { ReportMagistratCard, type ReportMagistrat } from './ReportMagistratCard';

const report: ReportMagistrat = {
  biography: [
    'J MARSEILLE 05/07/2015 (Ins.01/09/2015)',
    'VP MARSEILLE 18/07/2019 (Ins.02/09/2019)',
    'C BASTIA 26/06/2023 (Ins.01/09/2023)',
  ].join('\n'),
  birthDate: { year: 1978, month: 5, day: 14 },
  currentPosition: 'Conseiller CA BASTIA',
  dureeDuPoste: '4 ans et 11 mois',
  grade: 'G2',
  rank: '(12 sur une liste de 24)',
  targetedGrade: 'G3',
  targettedPosition: "Président de la chambre de l'instruction CA BORDEAUX",
};

const meta = {
  title: 'Features/ReportDetails/MagistratCard',
  component: ReportMagistratCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    report: { table: { disable: true } },
  },
} satisfies Meta<typeof ReportMagistratCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { report },
};

export const WithoutTargetedPosition: Story = {
  args: {
    report: { ...report, rank: null, targetedGrade: null, targettedPosition: null },
  },
};

export const WithoutBiography: Story = {
  args: {
    report: { ...report, biography: null, birthDate: null, dureeDuPoste: null },
  },
};
