import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, PropsWithChildren } from 'react';

import { AuditionNotice } from '@/features/nomination-files-table/components/cells/magistrat-side-panel/components/audition-date/AuditionNotice';
import { MissingSecondReporterNotice } from '@/features/nomination-files-table/components/cells/magistrat-side-panel/components/header/MissingSecondReporterNotice';
import { MissingEvaluationNotice } from '@/features/nomination-files-table/components/cells/magistrat-side-panel/components/missing-evaluation/MissingEvaluation';
import { ExcludedJurisdictionNotice } from '@/features/nomination-files-table/components/ExcludedJurisdictionNotice';
import type { ExcludedJurisdictionConflict } from '@/features/nomination-files-table/context/member-excluded-jurisdictions';

import { AlertBanner, AlertBannerAction } from './AlertBanner';

const LAYOUT = 'rounded px-4 py-3';

const NO_CONTROLS = { controls: { disable: true }, layout: 'padded' };

const UPCOMING = {
  auditionDate: { day: 15, month: 6, year: 2029 },
  auditionTime: { hours: 14, minutes: 30, seconds: 0 },
};
const PAST = {
  auditionDate: { day: 10, month: 1, year: 2020 },
  auditionTime: { hours: 14, minutes: 30, seconds: 0 },
};

const LYON = "Cour d'appel de Lyon";
const RENNES = "Cour d'appel de Rennes";

function conflict(memberName: string, jurisdiction: string): ExcludedJurisdictionConflict {
  return { fileId: 'file-1', fileNumber: 12, jurisdiction, memberId: memberName, memberName };
}

const EXCLUSIONS = [
  [conflict('Camille COMMUN', LYON)],
  [conflict('Camille COMMUN', LYON), conflict('Sophie SIÈGE', LYON)],
  [conflict('Camille COMMUN', LYON), conflict('Camille COMMUN', RENNES), conflict('Sophie SIÈGE', LYON)],
];

const BLEEDS_TOP = 'px-8 pt-10';
const BLEEDS_BOTTOM = 'px-8 pb-8';
const STACK = 'flex flex-col gap-4';

const ACTION_ONLY = {
  className: { table: { disable: true } },
  icon: { table: { disable: true } },
  message: { table: { disable: true } },
  tone: { table: { disable: true } },
};

function Notice(props: PropsWithChildren<{ className: string }>) {
  return <div className={props.className}>{props.children}</div>;
}

function AlertBannerStory({
  buttonAction,
  ...props
}: ComponentProps<typeof AlertBanner> & { buttonAction: boolean }) {
  return (
    <AlertBanner {...props}>
      {buttonAction && <AlertBannerAction onClick={() => {}}>Modifier</AlertBannerAction>}
    </AlertBanner>
  );
}

const meta = {
  title: 'Shared/AlertBanner',
  component: AlertBannerStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    buttonAction: { control: 'boolean' },
    children: { table: { disable: true } },
    className: { table: { disable: true } },
    icon: { control: 'text' },
    message: { control: 'text' },
    tone: { control: 'inline-radio', options: ['info', 'warning'] },
  },
  args: {
    buttonAction: true,
    className: LAYOUT,
    icon: 'fr-icon-warning-fill',
    message: 'Une alerte sur ce dossier',
    tone: 'warning',
  },
} satisfies Meta<typeof AlertBannerStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Audition: Story = {
  argTypes: ACTION_ONLY,
  render: ({ buttonAction }) => (
    <div className={STACK}>
      <Notice className={BLEEDS_TOP}>
        <AuditionNotice auditionDate={null} auditionMissing auditionTime={null} editable={buttonAction} />
      </Notice>
      <Notice className={BLEEDS_TOP}>
        <AuditionNotice {...UPCOMING} auditionMissing={false} editable={buttonAction} />
      </Notice>
      <Notice className={BLEEDS_TOP}>
        <AuditionNotice {...PAST} auditionMissing={false} editable={buttonAction} />
      </Notice>
    </div>
  ),
};

export const ExcludedJurisdiction: Story = {
  parameters: NO_CONTROLS,
  render: () => (
    <div className={STACK}>
      {EXCLUSIONS.map((conflicts) => (
        <ExcludedJurisdictionNotice conflicts={conflicts} key={JSON.stringify(conflicts)} />
      ))}
    </div>
  ),
};

export const MissingEvaluation: Story = {
  argTypes: ACTION_ONLY,
  render: ({ buttonAction }) => (
    <Notice className={BLEEDS_TOP}>
      <MissingEvaluationNotice editable={buttonAction} missingEvaluation />
    </Notice>
  ),
};

export const MissingSecondReporter: Story = {
  argTypes: ACTION_ONLY,
  render: ({ buttonAction }) => (
    <Notice className={BLEEDS_BOTTOM}>
      <MissingSecondReporterNotice editable={buttonAction} onAffect={() => {}} />
    </Notice>
  ),
};
