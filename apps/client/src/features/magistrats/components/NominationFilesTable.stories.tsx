import type { Meta, StoryObj } from '@storybook/react-vite';

import { NominationFilesTable } from './NominationFilesTable';

type NominationFile = Parameters<typeof NominationFilesTable>[0]['nominationFiles'][number];

function makeNominationFile(overrides: Partial<NominationFile>): NominationFile {
  return {
    auditionDate: null,
    auditionTime: null,
    dateTransparence: { year: 2026, month: 2, day: 20 },
    formation: 'SIEGE',
    isArchived: false,
    isSessionOngoing: false,
    nominationFileId: 'dossier-1',
    number: 12,
    outcome: null,
    reporters: [
      { firstName: 'Rachel', lastName: 'Bernard' },
      { firstName: 'Antoine', lastName: 'Roche' },
    ],
    sessionId: 'session-1',
    sessionName: 'Transparence Annuelle 2026',
    targetedGrade: 'G3',
    targetedPosition: 'Président de chambre CA AIX EN PROVENCE',
    ...overrides,
  };
}

const meta = {
  title: 'Features/Details/NominationFilesTable',
  component: NominationFilesTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    context: { table: { disable: true } },
    nominationFiles: { table: { disable: true } },
  },
} satisfies Meta<typeof NominationFilesTable>;

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
    <NominationFilesTable
      context="sg"
      nominationFiles={[
        makeNominationFile({
          auditionDate:
            args.audition === 'scheduled'
              ? { year: 2030, month: 9, day: 15 }
              : args.audition === 'past'
                ? { year: 2021, month: 3, day: 18 }
                : null,
          auditionTime: args.audition === 'none' ? null : { hours: 14, minutes: 30, seconds: 0 },
          isSessionOngoing: args.ongoingSession,
          number: args.dossierNumber,
          outcome:
            args.outcome === 'none' ? null : { label: OUTCOME_LABELS[args.outcome], value: args.outcome },
          reporters: REPORTERS.slice(0, args.reportersCount),
          sessionName: args.sessionName,
          targetedGrade: args.grade,
          targetedPosition: args.position,
        }),
      ]}
    />
  ),
};

export const ManyRows: Story = {
  args: {
    context: 'sg',
    nominationFiles: Array.from({ length: 10 }, (_, index) =>
      makeNominationFile({
        dateTransparence: { year: 2026 - index, month: 2, day: 20 },
        isSessionOngoing: index === 0,
        nominationFileId: `dossier-${index}`,
        number: index + 3,
        outcome: index === 0 ? null : { label: 'avis conforme', value: 'VALIDATED' },
        sessionName: `Transparence Annuelle ${2026 - index}`,
      }),
    ),
  },
};
