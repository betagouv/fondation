import Select from '@codegouvfr/react-dsfr/Select';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';

import { DetailsHeader } from './DetailsHeader';

const ACTIONS = {
  aucune: undefined,
  'statut du rapport': (
    <Select className="fr-mb-0" label="Statut du rapport" nativeSelectProps={{ defaultValue: 'progress' }}>
      <option value="new">Nouveau</option>
      <option value="progress">En cours</option>
    </Select>
  ),
};

const BREADCRUMBS = {
  aucun: undefined,
  'fiche magistrat': (
    <Breadcrumb
      ariaLabel="Fil d'Ariane de la fiche magistrat"
      breadcrumb={{
        currentPageLabel: 'Fiche magistrat',
        segments: [{ label: 'Secrétariat général', to: '/secretariat-general' }],
      }}
      className="fr-mt-0"
      id="details-header-breadcrumb"
    />
  ),
};

const meta = {
  title: 'Shared/DetailsHeader',
  component: DetailsHeader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    action: { control: 'inline-radio', mapping: ACTIONS, options: Object.keys(ACTIONS) },
    backLabel: { control: 'text' },
    breadcrumb: { control: 'inline-radio', mapping: BREADCRUMBS, options: Object.keys(BREADCRUMBS) },
    description: { control: 'text' },
    overline: { control: 'text' },
    title: { control: 'text' },
  },
  args: {
    action: 'aucune',
    backTo: '/transparences',
    breadcrumb: 'aucun',
    overline: 'Rapport',
    title: 'RAVEL Maurice',
  },
} satisfies Meta<typeof DetailsHeader>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
