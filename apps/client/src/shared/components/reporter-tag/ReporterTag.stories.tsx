import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import type { Meta, StoryObj } from '@storybook/react-vite';
import clsx from 'clsx';

import { Tooltip } from '@/shared/ui/tooltip';

import { ReporterTag } from './ReporterTag';

const excludedJurisdictionIcon = (
  <Tooltip label="Juridiction exclue pour Honorine VALROSE : Cour d'appel de Lyon">
    <i
      className={clsx(cx('fr-icon-warning-fill'), 'fr-icon--sm shrink-0')}
      style={{ color: colors.decisions.text.default.warning.default }}
    />
  </Tooltip>
);

const meta = {
  title: 'Shared/ReporterTag',
  component: ReporterTag,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    enableTooltip: { control: 'boolean' },
    icon: { table: { disable: true } },
    isCurrentUser: { control: 'boolean' },
    reporter: { control: 'object' },
  },
  args: {
    enableTooltip: true,
    isCurrentUser: false,
    reporter: { firstName: 'Honorine', lastName: 'Valrose' },
  },
} satisfies Meta<typeof ReporterTag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ExcludedJurisdiction: Story = {
  args: { enableTooltip: false },
  render: (args) => <ReporterTag icon={excludedJurisdictionIcon} {...args} />,
};

export const CurrentUser: Story = {
  args: { isCurrentUser: true },
};
