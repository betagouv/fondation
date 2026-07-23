import type { Meta, StoryObj } from '@storybook/react-vite';

import { MagistratNominationFilesTable } from './MagistratNominationFilesTable';

type NominationFile = Parameters<typeof MagistratNominationFilesTable>[0]['nominationFiles'][number];

function makeNominationFile(overrides: Partial<NominationFile>): NominationFile {
  return {
    nominationFileId: 'dossier-1',
    number: 12,
    reporters: [
      { firstName: 'Rachel', lastName: 'Bernard' },
      { firstName: 'Antoine', lastName: 'Roche' },
    ],
    sessionId: 'session-1',
    sessionName: 'Transparence Annuelle 2026',
    formation: 'SIEGE',
    dateTransparence: { year: 2026, month: 2, day: 20 },
    auditionDate: null,
    auditionTime: null,
    targetedGrade: 'G3',
    targetedPosition: 'Président de chambre CA AIX EN PROVENCE',
    outcome: null,
    isArchived: false,
    isSessionReported: false,
    ...overrides,
  };
}

const nominationFiles: NominationFile[] = [
  makeNominationFile({
    nominationFileId: 'dossier-2026',
    auditionDate: { year: 2026, month: 9, day: 15 },
    auditionTime: { hours: 14, minutes: 30, seconds: 0 },
    isSessionReported: true,
  }),
  makeNominationFile({
    nominationFileId: 'dossier-2021',
    number: 8,
    sessionName: 'Transparence Annuelle 2021',
    dateTransparence: { year: 2021, month: 2, day: 15 },
    auditionDate: { year: 2021, month: 3, day: 18 },
    auditionTime: { hours: 9, minutes: 30, seconds: 0 },
    targetedGrade: 'G2',
    targetedPosition: 'Conseiller CA LYON',
    outcome: { value: 'VALIDATED', label: 'avis conforme', comment: null },
    reporters: [{ firstName: 'Marie', lastName: 'Lefevre' }],
  }),
  makeNominationFile({
    nominationFileId: 'dossier-2019',
    number: 23,
    reporters: [],
    sessionName: 'Transparence Annuelle 2019',
    dateTransparence: { year: 2019, month: 3, day: 10 },
    targetedGrade: 'G2',
    targetedPosition: 'Vice-président TJ GRENOBLE',
    outcome: { value: 'WITHDRAWN', label: 'retrait (désistement)', comment: null },
    isArchived: true,
  }),
];

const meta = {
  title: 'Features/Details/MagistratNominationFilesTable',
  component: MagistratNominationFilesTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    context: { table: { disable: true } },
    nominationFiles: { table: { disable: true } },
  },
} satisfies Meta<typeof MagistratNominationFilesTable>;

export default meta;

type Story = StoryObj<typeof meta>;

const OUTCOME_LABELS = {
  VALIDATED: 'avis conforme',
  NON_VALIDATED: 'avis non conforme',
  SUSPENDED: 'suspendu',
  REMOVED: 'retiré',
  WITHDRAWN: 'retrait (désistement)',
  ASSESSING: 'en cours d’instruction',
  WAITING_DSJ: 'en attente DSJ',
} as const;

const REPORTERS = [
  { firstName: 'Rachel', lastName: 'Bernard' },
  { firstName: 'Antoine', lastName: 'Roche' },
  { firstName: 'Marie', lastName: 'Lefevre' },
];

type PlaygroundArgs = {
  audition: 'none' | 'scheduled' | 'past';
  dossierNumber: number;
  grade: string;
  ongoingSession: boolean;
  outcome: keyof typeof OUTCOME_LABELS | 'none';
  position: string;
  reportersCount: number;
  sessionName: string;
};

export const Playground: StoryObj<PlaygroundArgs> = {
  parameters: { controls: { exclude: ['nominationFiles'] } },
  args: {
    audition: 'none',
    dossierNumber: 12,
    grade: 'G3',
    ongoingSession: true,
    outcome: 'VALIDATED',
    position: 'Président de chambre CA AIX EN PROVENCE',
    reportersCount: 2,
    sessionName: 'Transparence Annuelle',
  },
  argTypes: {
    audition: { control: 'inline-radio', options: ['none', 'scheduled', 'past'] },
    outcome: { control: 'select', options: ['none', ...Object.keys(OUTCOME_LABELS)] },
    reportersCount: { control: { type: 'range', min: 0, max: REPORTERS.length, step: 1 } },
  },
  render: (args) => (
    <MagistratNominationFilesTable
      context="sg"
      nominationFiles={[
        makeNominationFile({
          sessionName: args.sessionName,
          number: args.dossierNumber,
          targetedGrade: args.grade,
          targetedPosition: args.position,
          isSessionReported: args.ongoingSession,
          auditionDate:
            args.audition === 'scheduled'
              ? { year: 2030, month: 9, day: 15 }
              : args.audition === 'past'
                ? { year: 2021, month: 3, day: 18 }
                : null,
          auditionTime: args.audition === 'none' ? null : { hours: 14, minutes: 30, seconds: 0 },
          outcome:
            args.outcome === 'none'
              ? null
              : { value: args.outcome, label: OUTCOME_LABELS[args.outcome], comment: null },
          reporters: REPORTERS.slice(0, args.reportersCount),
        }),
      ]}
    />
  ),
};

export const OngoingSession: Story = {
  args: { context: 'sg', enCoursIndicator: 'tint', nominationFiles },
  argTypes: {
    enCoursIndicator: { control: 'inline-radio', options: ['badge', 'dot', 'tint'] },
  },
};

export const ManyRows: Story = {
  args: {
    context: 'sg',
    nominationFiles: Array.from({ length: 10 }, (_, index) =>
      makeNominationFile({
        nominationFileId: `dossier-${index}`,
        number: index + 3,
        sessionName: `Transparence Annuelle ${2026 - index}`,
        dateTransparence: { year: 2026 - index, month: 2, day: 20 },
        outcome: index === 0 ? null : { value: 'VALIDATED', label: 'avis conforme', comment: null },
        isSessionReported: index === 0,
      }),
    ),
  },
};
