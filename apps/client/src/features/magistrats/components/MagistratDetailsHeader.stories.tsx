import type { Meta, StoryObj } from '@storybook/react-vite';

import type { DetailedMagistratDto } from '@api/types';

import { MagistratDetailsHeader } from './MagistratDetailsHeader';

const magistrat: DetailedMagistratDto = {
  birthDate: { year: 1971, month: 3, day: 24 },
  careerHistory: null,
  civilite: 'Mme',
  currentPosition: 'Conseiller CA LYON',
  externalUrl: 'https://lolfi.example.fr/magistrat/1',
  firstName: 'Clara',
  grade: 'G2',
  gradeDate: { year: 2019, month: 8, day: 16 },
  id: 'magistrat-1',
  installationDate: { year: 2021, month: 9, day: 1 },
  lastName: 'Schumann',
  nominationDate: { year: 2021, month: 7, day: 12 },
  observations: [],
  professionalEmail: 'clara.schumann@justice.gouv.fr',
  propositions: [],
  usedName: null,
};

const meta = {
  title: 'Features/Details/MagistratDetailsHeader',
  component: MagistratDetailsHeader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    magistrat: { table: { disable: true } },
  },
} satisfies Meta<typeof MagistratDetailsHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SgContext: Story = {
  args: { context: 'sg', magistrat },
};

export const MemberContext: Story = {
  args: { context: 'membre', magistrat },
};
