import type { Meta, StoryObj } from '@storybook/react-vite';

import { type MagistratNominationFile, MagistratNominationFilesTable } from './MagistratNominationFilesTable';

function makeNominationFile(overrides: Partial<MagistratNominationFile>): MagistratNominationFile {
  return {
    auditionDate: null,
    auditionExpected: false,
    auditionTime: null,
    canScheduleAudition: false,
    id: 'dossier-1',
    name: 'VALROSE Honorine',
    number: 12,
    outcome: null,
    reporters: [
      { id: 'user-1', firstName: 'Rachel', lastName: 'Bernard' },
      { id: 'user-2', firstName: 'Antoine', lastName: 'Roche' },
    ],
    session: {
      id: 'session-1',
      name: 'Transparence Annuelle 2026',
      formation: 'SIEGE',
      date: { year: 2026, month: 2, day: 20 },
      status: 'REPORTED',
    },
    targetedGrade: 'G3',
    targetedPosition: 'Président de chambre CA AIX EN PROVENCE',
    ...overrides,
  };
}

const meta = {
  title: 'Features/MagistratDetails/NominationFilesTable',
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

const OUTCOMES = [
  'VALIDATED',
  'NON_VALIDATED',
  'SUSPENDED',
  'REMOVED',
  'WITHDRAWN',
  'ASSESSING',
  'WAITING_DSJ',
] as const;

const REPORTERS = [
  { id: 'user-1', firstName: 'Rachel', lastName: 'Bernard' },
  { id: 'user-2', firstName: 'Antoine', lastName: 'Roche' },
  { id: 'user-3', firstName: 'Marie', lastName: 'Lefevre' },
];

type PlaygroundArgs = {
  audition: 'none' | 'expected' | 'scheduled' | 'past';
  canScheduleAudition: boolean;
  dossierNumber: number;
  grade: string;
  ongoingSession: boolean;
  outcome: (typeof OUTCOMES)[number] | 'none';
  position: string;
  reportersCount: number;
  sessionName: string;
};

export const Playground: StoryObj<PlaygroundArgs> = {
  parameters: { controls: { exclude: ['nominationFiles'] } },
  args: {
    audition: 'none',
    canScheduleAudition: true,
    dossierNumber: 12,
    grade: 'G3',
    ongoingSession: true,
    outcome: 'VALIDATED',
    position: 'Président de chambre CA AIX EN PROVENCE',
    reportersCount: 2,
    sessionName: 'Transparence Annuelle',
  },
  argTypes: {
    audition: { control: 'inline-radio', options: ['none', 'expected', 'scheduled', 'past'] },
    outcome: { control: 'select', options: ['none', ...OUTCOMES] },
    reportersCount: { control: { type: 'range', min: 0, max: REPORTERS.length, step: 1 } },
  },
  render: (args) => (
    <MagistratNominationFilesTable
      context="sg"
      nominationFiles={[
        makeNominationFile({
          auditionDate:
            args.audition === 'scheduled'
              ? { year: 2030, month: 9, day: 15 }
              : args.audition === 'past'
                ? { year: 2021, month: 3, day: 18 }
                : null,
          auditionExpected: args.audition === 'expected',
          auditionTime:
            args.audition === 'scheduled' || args.audition === 'past'
              ? { hours: 14, minutes: 30, seconds: 0 }
              : null,
          canScheduleAudition: args.canScheduleAudition,
          number: args.dossierNumber,
          outcome: args.outcome === 'none' ? null : { comment: null, value: args.outcome },
          reporters: REPORTERS.slice(0, args.reportersCount),
          session: {
            id: 'session-1',
            name: args.sessionName,
            formation: 'SIEGE',
            date: { year: 2026, month: 2, day: 20 },
            status: args.ongoingSession ? 'ONGOING' : 'REPORTED',
          },
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
        canScheduleAudition: index === 0,
        id: `dossier-${index}`,
        number: index + 3,
        outcome: index === 0 ? null : { comment: null, value: 'VALIDATED' },
        session: {
          id: `session-${index}`,
          name: `Transparence Annuelle ${2026 - index}`,
          formation: 'SIEGE',
          date: { year: 2026 - index, month: 2, day: 20 },
          status: index === 0 ? 'ONGOING' : 'REPORTED',
        },
      }),
    ),
  },
};
