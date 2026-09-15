import Select from '@codegouvfr/react-dsfr/Select';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';

import { DetailsHeader } from './DetailsHeader';

const meta = {
  title: 'Shared/DetailsHeader',
  component: DetailsHeader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    backTo: '/transparences',
    overline: 'Rapport',
    title: 'RAVEL Maurice',
  },
} satisfies Meta<typeof DetailsHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithAction: Story = {
  args: {
    action: (
      <Select className="fr-mb-0" label="Statut du rapport" nativeSelectProps={{ defaultValue: 'progress' }}>
        <option value="new">Nouveau</option>
        <option value="progress">En cours</option>
      </Select>
    ),
  },
};

export const WithBreadcrumb: Story = {
  args: {
    breadcrumb: (
      <Breadcrumb
        ariaLabel="Fil d'Ariane de la fiche magistrat"
        breadcrumb={{
          currentPageLabel: 'Fiche magistrat',
          segments: [{ label: 'Secrétariat général', to: '/secretariat-general' }],
        }}
        className="fr-my-0"
        id="details-header-breadcrumb"
      />
    ),
    overline: 'Fiche magistrat',
    title: 'Mme SCHUMANN Clara',
  },
};
