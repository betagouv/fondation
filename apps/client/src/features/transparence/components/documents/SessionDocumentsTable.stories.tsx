import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { sessionDocsHandlers } from '@/shared/storybook/msw.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';

import { DocActionAgendaFiles } from './DocActionAgendaFiles';
import { DocActionAgendaMetadata } from './DocActionAgendaMetadata';
import { DocActionDelete } from './DocActionDelete';
import { DocActionDetails } from './DocActionDetails';
import { DocActionUpdate } from './DocActionUpdate';
import { groupSessionDocuments } from './session-document-groups';
import { SessionDocumentsTable, type SessionDocument } from './SessionDocumentsTable';

const SESSION_ID = 'session-1';

const AGENDA_DATES = {
  createdAt: '2028-03-10T09:00:00.000Z',
  hasDraft: false,
  status: 'VALIDATED',
  validatedAt: '2028-03-10T11:00:00.000Z',
} as const;

const REPORT_DATES = {
  createdAt: '2028-03-13T09:00:00.000Z',
  hasDraft: false,
  status: 'VALIDATED',
  validatedAt: '2028-03-13T11:00:00.000Z',
} as const;

const DOCS: SessionDocument[] = [
  {
    ...AGENDA_DATES,
    id: 'agenda-1',
    name: 'Ordre du jour du 12 mars 2028 - Mme MARTIN Camille',
    officialReportId: 'official-report-1',
    outdated: false,
    type: 'agenda',
  },
  {
    ...AGENDA_DATES,
    id: 'agenda-2',
    name: 'Ordre du jour du 4 février 2028 - M. BERNARD Lucas',
    officialReportId: null,
    outdated: false,
    type: 'agenda',
  },
  {
    ...AGENDA_DATES,
    id: 'agenda-3',
    name: 'Ordre du jour du 8 janvier 2028 - M. BERNARD Lucas',
    officialReportId: 'official-report-2',
    outdated: false,
    type: 'agenda',
  },
  {
    ...REPORT_DATES,
    id: 'official-report-1',
    name: 'Procès-verbal du 12 mars 2028 - Mme MARTIN Camille',
    outdated: false,
    type: 'officialReport',
  },
  {
    ...REPORT_DATES,
    id: 'official-report-2',
    name: 'Procès-verbal du 8 janvier 2028 - M. BERNARD Lucas',
    outdated: true,
    type: 'officialReport',
  },
];

function DocActions(doc: SessionDocument) {
  return (
    <div className="-ml-2 grid grid-cols-4 items-center gap-1">
      {doc.type === 'agenda' && (
        <>
          <DocActionAgendaFiles agendaId={doc.id} disabled={false} name={doc.name} sessionId={SESSION_ID} />
          <DocActionAgendaMetadata
            agendaId={doc.id}
            disabled={false}
            name={doc.name}
            sessionId={SESSION_ID}
          />
        </>
      )}
      <div className="col-start-3">
        <DocActionUpdate disabled={false} doc={doc} sessionId={SESSION_ID} />
      </div>
      <DocActionDelete disabled={false} doc={doc} sessionId={SESSION_ID} />
    </div>
  );
}

const setIsActing = fn().mockName('setIsActing');

function DocName(doc: SessionDocument) {
  return <DocActionDetails disabled={false} doc={doc} sessionId={SESSION_ID} setIsActing={setIsActing} />;
}

const meta = {
  title: 'Session/Transparence/SessionDocumentsTable',
  component: SessionDocumentsTable,
  beforeEach: ({ msw }) => {
    msw.use(...sessionDocsHandlers);
  },
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
  args: { actions: DocActions, groups: groupSessionDocuments(DOCS), renderName: DocName },
} satisfies Meta<typeof SessionDocumentsTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = {
  args: { groups: [] },
};

export const AgendasSharingAnOfficialReport: Story = {
  args: {
    groups: groupSessionDocuments([
      {
        ...AGENDA_DATES,
        id: 'agenda-siege',
        name: 'Ordre du jour du 12 mars 2028 - Siège',
        officialReportId: 'official-report-1',
        outdated: false,
        type: 'agenda',
      },
      {
        ...AGENDA_DATES,
        id: 'agenda-parquet',
        name: 'Ordre du jour du 12 mars 2028 - Parquet',
        officialReportId: 'official-report-1',
        outdated: false,
        type: 'agenda',
      },
      {
        ...REPORT_DATES,
        id: 'official-report-1',
        name: 'Procès-verbal du 12 mars 2028 - Mme MARTIN Camille',
        outdated: false,
        type: 'officialReport',
      },
      {
        ...AGENDA_DATES,
        id: 'agenda-orphan',
        name: 'Ordre du jour du 4 février 2028 - M. BERNARD Lucas',
        officialReportId: null,
        outdated: false,
        type: 'agenda',
      },
    ]),
  },
};

export const Archived: Story = {
  args: { actions: undefined },
};

export const ManyRows: Story = {
  args: {
    groups: groupSessionDocuments(
      Array.from({ length: 50 }, (_, index) =>
        index % 2 === 0
          ? {
              ...AGENDA_DATES,
              id: `agenda-${index}`,
              name: `Ordre du jour du ${(index % 28) + 1} mars 2028`,
              officialReportId: index % 4 === 0 ? `official-report-${index + 1}` : null,
              outdated: false,
              type: 'agenda' as const,
            }
          : {
              ...REPORT_DATES,
              id: `official-report-${index}`,
              name: `Procès-verbal du ${(index % 28) + 1} mars 2028`,
              outdated: index % 5 === 0,
              type: 'officialReport' as const,
            },
      ),
    ),
  },
};
