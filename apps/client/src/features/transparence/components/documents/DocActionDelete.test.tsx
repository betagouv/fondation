import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '@/shared/ui/toast';

import { DocActionDelete } from './DocActionDelete';
import {
  SessionDocumentsTableContext,
  type Association,
  type SessionDocument,
} from './SessionDocumentsTable';

const deleteAgenda = vi.fn();
const deleteOfficialReport = vi.fn();
const waitForConfirmation = vi.fn();

vi.mock('@/shared/context/confirm-modal', () => ({
  useConfirmModal: () => ({ waitForConfirmation }),
}));

vi.mock('@queries/agenda.queries', () => ({
  useDeleteAgenda: () => ({ mutate: deleteAgenda, isPending: false }),
  useDeleteOfficialReportMutation: () => ({
    mutate: deleteOfficialReport,
    isPending: false,
  }),
}));

const AGENDA: SessionDocument = {
  createdAt: '2028-03-10T09:00:00.000Z',
  hasDraft: false,
  id: 'agenda-1',
  name: 'Ordre du jour du 12 mars 2028',
  officialReportId: null,
  outdated: false,
  status: 'VALIDATED',
  type: 'agenda',
  hasPresentationPlan: false,
  validatedAt: '2028-03-10T11:00:00.000Z',
};

const OFFICIAL_REPORT: SessionDocument = {
  createdAt: '2028-03-13T09:00:00.000Z',
  hasDraft: false,
  id: 'official-report-1',
  name: 'Procès-verbal du 12 mars 2028',
  outdated: false,
  status: 'VALIDATED',
  type: 'officialReport',
  validatedAt: '2028-03-13T11:00:00.000Z',
};

async function clickDelete(doc: SessionDocument, association?: Association) {
  const user = userEvent.setup();
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <ToastProvider>
        <SessionDocumentsTableContext.Provider
          value={{ associations: association && new Map([[doc.id, association]]) }}
        >
          <DocActionDelete disabled={false} doc={doc} sessionId="session-1" />
        </SessionDocumentsTableContext.Provider>
      </ToastProvider>
    </IntlProvider>,
  );

  await user.click(screen.getByRole('button', { name: `Supprimer ${doc.name}` }));
}

describe('DocActionDelete', () => {
  beforeEach(() => {
    deleteAgenda.mockReset();
    deleteOfficialReport.mockReset();
    waitForConfirmation.mockReset().mockResolvedValue({ isConfirmed: true });
  });

  it('should ask to confirm before deleting', async () => {
    await clickDelete(AGENDA);

    expect(waitForConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        title: `Confirmer la suppression de "${AGENDA.name}"`,
      }),
    );
  });

  it('should keep the document when the deletion is not confirmed', async () => {
    waitForConfirmation.mockResolvedValue({ isConfirmed: false });

    await clickDelete(AGENDA);

    expect(deleteAgenda).not.toHaveBeenCalled();
    expect(deleteOfficialReport).not.toHaveBeenCalled();
  });

  it('should delete an agenda', async () => {
    await clickDelete(AGENDA);

    expect(deleteAgenda).toHaveBeenCalledWith({ agendaId: AGENDA.id }, expect.anything());
    expect(deleteOfficialReport).not.toHaveBeenCalled();
  });

  it('should delete an official report', async () => {
    await clickDelete(OFFICIAL_REPORT);

    expect(deleteOfficialReport).toHaveBeenCalledWith(
      { officialReportId: OFFICIAL_REPORT.id },
      expect.anything(),
    );
    expect(deleteAgenda).not.toHaveBeenCalled();
  });

  async function confirmationContent() {
    const { content } = waitForConfirmation.mock.calls[0][0];
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        {content}
      </IntlProvider>,
    );
  }

  it('should say the linked official report is validated', async () => {
    const officialReport = { ...OFFICIAL_REPORT, status: 'VALIDATED' as const };
    await clickDelete(
      { ...AGENDA, officialReportId: officialReport.id },
      { agendasCount: 1, associated: [officialReport] },
    );
    await confirmationContent();

    expect(screen.getByText('Le PV lié est validé et sera supprimé.')).toBeInTheDocument();
  });

  it('should say how many other agendas lose their official report', async () => {
    await clickDelete(
      { ...AGENDA, officialReportId: OFFICIAL_REPORT.id },
      { agendasCount: 3, associated: [OFFICIAL_REPORT] },
    );
    await confirmationContent();

    expect(
      screen.getByText('Ce PV couvre 2 autres ordres du jour qui perdront le sien.'),
    ).toBeInTheDocument();
  });

  it('should say the notice goes away with the agenda', async () => {
    await clickDelete({ ...AGENDA, hasPresentationPlan: true });
    await confirmationContent();

    expect(screen.getByText('La notice de restitution liée sera supprimée elle aussi.')).toBeInTheDocument();
  });
  it('should warn that the linked official report goes with the agenda', async () => {
    await clickDelete({ ...AGENDA, officialReportId: 'official-report-1' });

    const { content } = waitForConfirmation.mock.calls[0][0];
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        {content}
      </IntlProvider>,
    );

    expect(screen.getByText('Cela entraînera la suppression du PV lié.')).toBeInTheDocument();
  });
});
