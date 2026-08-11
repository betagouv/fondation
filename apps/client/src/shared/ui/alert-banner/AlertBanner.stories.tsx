import type { Meta, StoryObj } from '@storybook/react-vite';

import { AuditionScheduledBanner } from '@/shared/components/audition-banner';

import { AlertBanner, AlertBannerAction } from './AlertBanner';

const LAYOUT = 'rounded px-4 py-3';

const UPCOMING = { date: { day: 15, month: 6, year: 2029 }, time: { hours: 14, minutes: 30, seconds: 0 } };
const PAST = { date: { day: 10, month: 1, year: 2020 }, time: { hours: 14, minutes: 30, seconds: 0 } };

const meta = {
  title: 'Shared/AlertBanner',
  component: AlertBanner,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    className: LAYOUT,
    icon: 'fr-icon-warning-fill',
    message: 'Une alerte sur ce dossier',
    tone: 'warning',
  },
} satisfies Meta<typeof AlertBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Warning: Story = {};

export const Info: Story = { args: { icon: 'fr-icon-info-fill', tone: 'info' } };

export const WithAction: Story = {
  args: { children: <AlertBannerAction onClick={() => {}}>Modifier</AlertBannerAction> },
};

export const AuditionToSchedule: Story = {
  args: {
    children: <AlertBannerAction onClick={() => {}}>Planifier</AlertBannerAction>,
    message: 'Une audition est à prévoir pour ce poste',
  },
};

export const MissingEvaluation: Story = {
  args: { icon: 'fr-icon-draft-line', message: 'Évaluation manquante dans le dossier administratif LOLFI' },
};

export const MissingSecondReporter: Story = {
  args: {
    children: <AlertBannerAction onClick={() => {}}>Affecter</AlertBannerAction>,
    message: '2 rapporteurs sont attendus pour ce poste',
  },
};

export const AuditionScheduled: Story = {
  render: () => <AuditionScheduledBanner className={LAYOUT} {...UPCOMING} />,
};

export const AuditionPast: Story = {
  render: () => <AuditionScheduledBanner className={LAYOUT} {...PAST} />,
};
