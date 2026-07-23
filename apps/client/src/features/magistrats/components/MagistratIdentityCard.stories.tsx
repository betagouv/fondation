import type { Meta, StoryObj } from '@storybook/react-vite';

import type { DetailedMagistratDto } from '@api/types';

import { MagistratIdentityCard } from './MagistratIdentityCard';

const magistrat: DetailedMagistratDto = {
  birthDate: { year: 1971, month: 3, day: 24 },
  careerHistory: null,
  civilite: 'Mme',
  currentPosition: 'Conseiller CA LYON',
  externalUrl: 'https://lolfi.example.fr/magistrat/1',
  firstName: 'Nathalie',
  grade: 'G2',
  gradeDate: { year: 2019, month: 8, day: 16 },
  id: 'magistrat-1',
  installationDate: { year: 2021, month: 9, day: 1 },
  lastName: 'Vasseur',
  nominationDate: { year: 2021, month: 7, day: 12 },
  observations: [],
  professionalEmail: 'nathalie.roussel@justice.gouv.fr',
  propositions: [],
  usedName: 'Roussel',
};

const meta = {
  title: 'Features/Details/MagistratIdentityCard',
  component: MagistratIdentityCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    magistrat: { table: { disable: true } },
  },
} satisfies Meta<typeof MagistratIdentityCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { magistrat },
};

export const AppointedNotYetInstalled: Story = {
  args: {
    magistrat: {
      ...magistrat,
      birthDate: { year: 1979, month: 11, day: 8 },
      civilite: 'M.',
      currentPosition: 'Personnels détachés',
      firstName: 'Julien',
      grade: 'G3',
      gradeDate: null,
      installationDate: null,
      lastName: 'Delattre',
      nominationDate: { year: 2026, month: 4, day: 20 },
      professionalEmail: 'julien.delattre@justice.gouv.fr',
      usedName: null,
    },
  },
};
