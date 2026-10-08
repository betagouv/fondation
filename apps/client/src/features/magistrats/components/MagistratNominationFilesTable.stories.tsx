import type { Meta, StoryObj } from '@storybook/react-vite';

import { type MagistratNominationFile, MagistratNominationFilesTable } from './MagistratNominationFilesTable';

function makeNominationFile(overrides: Partial<MagistratNominationFile>): MagistratNominationFile {
  return {
    auditionDate: null,
    auditionRequired: false,
    auditionTime: null,
    canScheduleAudition: false,
    id: 'dossier-1',
    name: 'VALROSE Honorine',
    number: 12,
    outcome: null,
    reporters: [
      { firstName: 'Rachel', id: 'user-1', lastName: 'Bernard' },
      { firstName: 'Antoine', id: 'user-2', lastName: 'Roche' },
    ],
    session: {
      date: { day: 20, month: 2, year: 2026 },
      formation: 'SIEGE',
      id: 'session-1',
      name: 'Transparence Annuelle 2026',
      status: 'REPORTED',
    },
    targetedGrade: 'G3',
    targetedPosition: 'Président de chambre CA AIX EN PROVENCE',
    ...overrides,
  };
}

const meta = {
  argTypes: {
    context: { table: { disable: true } },
    nominationFiles: { table: { disable: true } },
  },
  component: MagistratNominationFilesTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  title: 'Features/MagistratDetails/NominationFilesTable',
} satisfies Meta<typeof MagistratNominationFilesTable>;

export default meta;

type Story = StoryObj<typeof meta>;

const OUTCOMES = ['VALIDATED', 'NON_VALIDATED', 'SUSPENDED', 'REMOVED', 'WITHDRAWN', 'WAITING_DSJ'] as const;

const REPORTERS = [
  { firstName: 'Rachel', id: 'user-1', lastName: 'Bernard' },
  { firstName: 'Antoine', id: 'user-2', lastName: 'Roche' },
  { firstName: 'Marie', id: 'user-3', lastName: 'Lefevre' },
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
  argTypes: {
    audition: { control: 'inline-radio', options: ['none', 'expected', 'scheduled', 'past'] },
    outcome: { control: 'select', options: ['none', ...OUTCOMES] },
    reportersCount: { control: { max: REPORTERS.length, min: 0, step: 1, type: 'range' } },
  },
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
  parameters: { controls: { exclude: ['nominationFiles'] } },
  render: (args) => (
    <MagistratNominationFilesTable
      context="sg"
      nominationFiles={[
        makeNominationFile({
          auditionDate:
            args.audition === 'scheduled'
              ? { day: 15, month: 9, year: 2030 }
              : args.audition === 'past'
                ? { day: 18, month: 3, year: 2021 }
                : null,
          auditionRequired: args.audition === 'expected',
          auditionTime:
            args.audition === 'scheduled' || args.audition === 'past'
              ? { hours: 14, minutes: 30, seconds: 0 }
              : null,
          canScheduleAudition: args.canScheduleAudition,
          number: args.dossierNumber,
          outcome: args.outcome === 'none' ? null : { comment: null, value: args.outcome },
          reporters: REPORTERS.slice(0, args.reportersCount),
          session: {
            date: { day: 20, month: 2, year: 2026 },
            formation: 'SIEGE',
            id: 'session-1',
            name: args.sessionName,
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
          date: { day: 20, month: 2, year: 2026 - index },
          formation: 'SIEGE',
          id: `session-${index}`,
          name: `Transparence Annuelle ${2026 - index}`,
          status: index === 0 ? 'ONGOING' : 'REPORTED',
        },
      }),
    ),
  },
};
