import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { sessionDocsHandlers } from '@/shared/storybook/msw.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import type { PlainDateOnly } from '@/utils/date-only.util';

import { DocActionDetails } from './DocActionDetails';
import { NewOfficialReportButton } from './NewOfficialReportButton';
import {
  groupSessionDocuments,
  type AgendaDocument,
  type OfficialReportDocument,
} from './session-document-groups';
import { SessionDocumentActions } from './SessionDocumentActions';
import { SessionDocumentsTable, type SessionDocument } from './SessionDocumentsTable';

const SESSION_ID = 'session-1';

const CAMILLE = { id: 'user-camille', name: 'Camille Martin' };
const LUCAS = { id: 'user-lucas', name: 'Lucas Bernard' };

function fileName(type: 'ODJ' | 'PV', date: PlainDateOnly, initials = 'PP') {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${type} - ${pad(date.day)}-${pad(date.month)}-${date.year} - ${initials}.pdf`;
}

function anAgenda(
  props: Pick<AgendaDocument, 'id' | 'meetingDate'> & Partial<AgendaDocument>,
): AgendaDocument {
  const officialReportId = props.officialReportId ?? null;

  return {
    createdAt: '2026-08-20T09:00:00.000Z',
    createdBy: CAMILLE,
    draftChangesBy: null,
    draftUpdate: null,
    name: fileName('ODJ', props.meetingDate),
    officialReportId,
    officialReportReadiness: officialReportId ? null : { status: 'READY' },
    outdated: false,
    presentationPlans: [],
    status: 'VALIDATED',
    type: 'agenda',
    validatedAt: '2026-08-21T14:30:00.000Z',
    validatedBy: LUCAS,
    ...props,
  };
}

function anOfficialReport(
  props: Pick<OfficialReportDocument, 'id' | 'meetingDate'> & Partial<OfficialReportDocument>,
): OfficialReportDocument {
  return {
    createdAt: '2026-09-01T09:00:00.000Z',
    createdBy: LUCAS,
    draftChangesBy: null,
    draftUpdate: null,
    name: fileName('PV', props.meetingDate),
    outdated: false,
    status: 'VALIDATED',
    type: 'officialReport',
    validatedAt: '2026-09-02T16:00:00.000Z',
    validatedBy: CAMILLE,
    ...props,
  };
}

const DRAFT = {
  draftChangesBy: 'PERSON',
  draftUpdate: { at: '2026-09-24T10:15:00.000Z', by: LUCAS, causes: [], origin: 'PERSON' },
  status: 'DRAFT',
  validatedAt: null,
  validatedBy: null,
} satisfies Partial<SessionDocument>;

const DOCS: SessionDocument[] = [
  anAgenda({ id: 'agenda-30-09', meetingDate: { day: 30, month: 9, year: 2026 } }),
  anAgenda({
    id: 'agenda-29-09',
    meetingDate: { day: 29, month: 9, year: 2026 },
    officialReportReadiness: {
      filesWithoutOutcome: 2,
      filesWithoutReporter: 1,
      filesWithUnpublishedReporter: 0,
      status: 'INCOMPLETE',
    },
  }),
  anAgenda({
    id: 'agenda-28-09',
    meetingDate: { day: 28, month: 9, year: 2026 },
    officialReportReadiness: { status: 'NEVER_PUBLISHED' },
  }),
  anAgenda({ id: 'agenda-pp', meetingDate: { day: 23, month: 9, year: 2026 }, officialReportId: 'pv-23-09' }),
  anAgenda({
    id: 'agenda-rmbl',
    meetingDate: { day: 23, month: 9, year: 2026 },
    name: fileName('ODJ', { day: 23, month: 9, year: 2026 }, 'RMBL'),
    officialReportId: 'pv-23-09',
  }),
  anOfficialReport({ id: 'pv-23-09', meetingDate: { day: 23, month: 9, year: 2026 } }),
  anAgenda({
    draftChangesBy: 'PERSON',
    draftUpdate: { at: '2026-09-22T17:40:00.000Z', by: CAMILLE, causes: [], origin: 'PERSON' },
    id: 'agenda-16-09',
    meetingDate: { day: 16, month: 9, year: 2026 },
    officialReportId: 'pv-16-09',
  }),
  anOfficialReport({ id: 'pv-16-09', meetingDate: { day: 16, month: 9, year: 2026 }, outdated: true }),
  anAgenda({ ...DRAFT, id: 'agenda-09-09', meetingDate: { day: 9, month: 9, year: 2026 } }),
  anAgenda({
    id: 'agenda-02-09',
    meetingDate: { day: 2, month: 9, year: 2026 },
    officialReportId: 'pv-02-09',
    outdated: true,
  }),
  anOfficialReport({ ...DRAFT, id: 'pv-02-09', meetingDate: { day: 2, month: 9, year: 2026 } }),
];

function Actions(doc: SessionDocument) {
  return <SessionDocumentActions disabled={false} doc={doc} sessionId={SESSION_ID} />;
}

function NewOfficialReport(agenda: AgendaDocument) {
  return <NewOfficialReportButton agenda={agenda} sessionId={SESSION_ID} />;
}

const setIsActing = fn().mockName('setIsActing');

function DocName(doc: SessionDocument) {
  return <DocActionDetails disabled={false} doc={doc} sessionId={SESSION_ID} setIsActing={setIsActing} />;
}

const meta = {
  args: {
    actions: Actions,
    groups: groupSessionDocuments(DOCS),
    newOfficialReport: NewOfficialReport,
    renderName: DocName,
  },
  beforeEach: ({ msw }) => {
    msw.use(...sessionDocsHandlers);
  },
  component: SessionDocumentsTable,
  decorators: [
    (Story) => (
      <StoryQueryClient>
        <ToastProvider>
          <ConfirmModalProvider>
            <Story />
          </ConfirmModalProvider>
        </ToastProvider>
      </StoryQueryClient>
    ),
  ],
  parameters: { controls: { include: ['groups'] }, layout: 'padded' },
  tags: ['autodocs'],
  title: 'Session/Transparence/SessionDocumentsTable',
} satisfies Meta<typeof SessionDocumentsTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = {
  args: { groups: [] },
};

export const Archived: Story = {
  args: { actions: undefined, newOfficialReport: undefined },
};

const CHANGES_IN_PROGRESS = {
  draftChangesBy: 'PERSON',
  draftUpdate: { at: '2026-09-22T17:40:00.000Z', by: CAMILLE, causes: [], origin: 'PERSON' },
} satisfies Partial<SessionDocument>;

function aMeeting(index: number): SessionDocument[] {
  const meetingDate = { day: 25 - index, month: 9, year: 2026 };
  const agenda = { id: `agenda-${index}`, meetingDate };
  const officialReport = { id: `pv-${index}`, meetingDate };
  const reported = { ...agenda, officialReportId: officialReport.id };

  switch (index % 8) {
    case 0:
      return [anAgenda(agenda)];
    case 1:
      return [anAgenda(reported), anOfficialReport(officialReport)];
    case 2:
      return [
        anAgenda({ ...reported, ...CHANGES_IN_PROGRESS }),
        anOfficialReport({ ...officialReport, outdated: true }),
      ];
    case 3:
      return [anAgenda({ ...agenda, ...DRAFT })];
    case 4:
      return [anAgenda({ ...reported, outdated: true }), anOfficialReport({ ...officialReport, ...DRAFT })];
    case 5:
      return [
        anAgenda({
          ...agenda,
          officialReportReadiness: {
            filesWithoutOutcome: 3,
            filesWithoutReporter: 0,
            filesWithUnpublishedReporter: 0,
            status: 'INCOMPLETE',
          },
        }),
      ];
    case 6:
      return [
        anAgenda(reported),
        anOfficialReport({
          ...officialReport,
          draftChangesBy: 'SYSTEM',
          draftUpdate: {
            at: '2026-09-23T08:00:00.000Z',
            by: null,
            causes: ['AGENDA_TEXT', 'REPORTERS'],
            origin: 'SYSTEM',
          },
        }),
      ];
    default:
      return [
        anAgenda({ ...reported, ...CHANGES_IN_PROGRESS }),
        anOfficialReport({ ...officialReport, ...CHANGES_IN_PROGRESS }),
      ];
  }
}

export const ManyRows: Story = {
  args: { groups: groupSessionDocuments(Array.from({ length: 25 }, (_, index) => aMeeting(index)).flat()) },
};
