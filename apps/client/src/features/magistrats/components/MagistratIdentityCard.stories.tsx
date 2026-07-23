import type { Meta, StoryObj } from '@storybook/react-vite';

import type { DetailedMagistratDto } from '@api/types';

import { MagistratIdentityCard } from './MagistratIdentityCard';

const magistrat: DetailedMagistratDto = {
  id: 'magistrat-1',
  civilite: 'Mme',
  firstName: 'Nathalie',
  lastName: 'Vasseur',
  usedName: 'Roussel',
  birthDate: { year: 1971, month: 3, day: 24 },
  grade: 'G2',
  gradeDate: { year: 2019, month: 8, day: 16 },
  nominationDate: { year: 2021, month: 7, day: 12 },
  installationDate: { year: 2021, month: 9, day: 1 },
  professionalEmail: 'nathalie.roussel@justice.gouv.fr',
  currentPosition: 'Conseiller CA LYON',
  careerHistory: null,
  externalUrl: 'https://lolfi.example.fr/magistrat/1',
  propositions: [],
  observations: [],
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
      firstName: 'Julien',
      lastName: 'Delattre',
      usedName: null,
      civilite: 'M.',
      birthDate: { year: 1979, month: 11, day: 8 },
      grade: 'G3',
      gradeDate: null,
      nominationDate: { year: 2026, month: 4, day: 20 },
      installationDate: null,
      professionalEmail: 'julien.delattre@justice.gouv.fr',
      currentPosition: 'Personnels détachés',
    },
  },
};
