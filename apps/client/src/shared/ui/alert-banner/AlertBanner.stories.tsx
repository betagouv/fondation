import type { Meta, StoryObj } from '@storybook/react-vite';

import { AuditionScheduledBanner } from '@/shared/components/audition-banner';

import { AlertBanner, AlertBannerAction } from './AlertBanner';

const LAYOUT = 'rounded px-4 py-3';

const LYON = "Cour d'appel de Lyon";
const RENNES = "Cour d'appel de Rennes";

const UPCOMING = { date: { day: 15, month: 6, year: 2029 }, time: { hours: 14, minutes: 30, seconds: 0 } };
const PAST = { date: { day: 10, month: 1, year: 2020 }, time: { hours: 14, minutes: 30, seconds: 0 } };

const NO_CONTROLS = { controls: { disable: true }, layout: 'padded' };

const meta = {
  title: 'Shared/AlertBanner',
  component: AlertBanner,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    children: { table: { disable: true } },
    className: { table: { disable: true } },
    icon: { control: 'text' },
    message: { control: 'text' },
    tone: { control: 'inline-radio', options: ['info', 'warning'] },
  },
  args: {
    className: LAYOUT,
    icon: 'fr-icon-warning-fill',
    message: 'Une alerte sur ce dossier',
    tone: 'warning',
  },
} satisfies Meta<typeof AlertBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AuditionToSchedule: Story = {
  args: {
    children: <AlertBannerAction onClick={() => {}}>Planifier</AlertBannerAction>,
    message: 'Une audition est à prévoir pour ce poste',
  },
  parameters: NO_CONTROLS,
};

export const AuditionScheduled: Story = {
  parameters: NO_CONTROLS,
  render: () => <AuditionScheduledBanner className={LAYOUT} {...UPCOMING} />,
};

export const AuditionPast: Story = {
  parameters: NO_CONTROLS,
  render: () => <AuditionScheduledBanner className={LAYOUT} {...PAST} />,
};

export const MissingEvaluation: Story = {
  args: { icon: 'fr-icon-draft-line', message: 'Évaluation manquante dans le dossier administratif LOLFI' },
  parameters: NO_CONTROLS,
};

export const MissingSecondReporter: Story = {
  args: {
    children: <AlertBannerAction onClick={() => {}}>Affecter</AlertBannerAction>,
    message: '2 rapporteurs sont attendus pour ce poste',
  },
  parameters: NO_CONTROLS,
};

export const ExcludedJurisdiction: Story = {
  args: { message: `Juridiction exclue pour Marie LEFEVRE : ${LYON}` },
  parameters: NO_CONTROLS,
};

export const SharedExcludedJurisdiction: Story = {
  args: { message: `Juridiction exclue pour Marie LEFEVRE et Paul MOREAU : ${LYON}` },
  parameters: NO_CONTROLS,
};

export const ExcludedJurisdictions: Story = {
  args: {
    message: (
      <ul className="fr-mb-0 flex flex-col gap-1">
        <li>
          Juridictions exclues pour Marie LEFEVRE : {LYON} et {RENNES}
        </li>
        <li>Juridiction exclue pour Paul MOREAU : {LYON}</li>
      </ul>
    ),
  },
  parameters: NO_CONTROLS,
};
