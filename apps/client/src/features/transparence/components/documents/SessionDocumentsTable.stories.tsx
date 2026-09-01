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

const DOCS: SessionDocument[] = [
  {
    id: 'agenda-1',
    type: 'agenda',
    name: 'Ordre du jour du 12 mars 2028 - Mme MARTIN Camille',
    officialReportId: 'official-report-1',
  },
  {
    id: 'agenda-2',
    type: 'agenda',
    name: 'Ordre du jour du 4 février 2028 - M. BERNARD Lucas',
    officialReportId: null,
  },
  {
    id: 'agenda-3',
    type: 'agenda',
    name: 'Ordre du jour du 8 janvier 2028 - M. BERNARD Lucas',
    officialReportId: 'official-report-2',
  },
  {
    id: 'official-report-1',
    type: 'officialReport',
    name: 'Procès-verbal du 12 mars 2028 - Mme MARTIN Camille',
    outdated: false,
  },
  {
    id: 'official-report-2',
    type: 'officialReport',
    name: 'Procès-verbal du 8 janvier 2028 - M. BERNARD Lucas',
    outdated: true,
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

/** two agendas covered by the same official report: the three rows form a single frame */
export const AgendasSharingAnOfficialReport: Story = {
  args: {
    groups: groupSessionDocuments([
      {
        id: 'agenda-siege',
        type: 'agenda',
        name: 'Ordre du jour du 12 mars 2028 - Siège',
        officialReportId: 'official-report-1',
      },
      {
        id: 'agenda-parquet',
        type: 'agenda',
        name: 'Ordre du jour du 12 mars 2028 - Parquet',
        officialReportId: 'official-report-1',
      },
      {
        id: 'official-report-1',
        type: 'officialReport',
        name: 'Procès-verbal du 12 mars 2028 - Mme MARTIN Camille',
        outdated: false,
      },
      {
        id: 'agenda-orphan',
        type: 'agenda',
        name: 'Ordre du jour du 4 février 2028 - M. BERNARD Lucas',
        officialReportId: null,
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
              id: `agenda-${index}`,
              type: 'agenda' as const,
              name: `Ordre du jour du ${(index % 28) + 1} mars 2028`,
              officialReportId: index % 4 === 0 ? `official-report-${index + 1}` : null,
            }
          : {
              id: `official-report-${index}`,
              type: 'officialReport' as const,
              name: `Procès-verbal du ${(index % 28) + 1} mars 2028`,
              outdated: index % 5 === 0,
            },
      ),
    ),
  },
};
