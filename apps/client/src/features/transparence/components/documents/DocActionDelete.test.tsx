import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DocActionDelete } from './DocActionDelete';
import type { SessionDocument } from './SessionDocumentsTable';

const deleteAgenda = vi.fn();
const deleteOfficialReport = vi.fn();
const waitForConfirmation = vi.fn();

vi.mock('@/shared/context/confirmation', () => ({
  useConfirmation: () => ({ buttonProps: {}, waitForConfirmation }),
}));

vi.mock('@queries/agenda.queries', () => ({
  useDeleteAgenda: () => ({ mutate: deleteAgenda, isPending: false }),
  useDeleteOfficialReportMutation: () => ({
    mutate: deleteOfficialReport,
    isPending: false,
  }),
}));

const AGENDA: SessionDocument = {
  id: 'agenda-1',
  type: 'agenda',
  name: 'Ordre du jour du 12 mars 2028',
  isLinkedToOfficialReport: false,
};

const OFFICIAL_REPORT: SessionDocument = {
  id: 'official-report-1',
  type: 'officialReport',
  name: 'Procès-verbal du 12 mars 2028',
  outdated: false,
};

async function clickDelete(doc: SessionDocument) {
  const user = userEvent.setup();
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <DocActionDelete disabled={false} doc={doc} sessionId="session-1" />
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

    expect(deleteAgenda).toHaveBeenCalledWith({ agendaId: AGENDA.id });
    expect(deleteOfficialReport).not.toHaveBeenCalled();
  });

  it('should delete an official report', async () => {
    await clickDelete(OFFICIAL_REPORT);

    expect(deleteOfficialReport).toHaveBeenCalledWith({
      officialReportId: OFFICIAL_REPORT.id,
    });
    expect(deleteAgenda).not.toHaveBeenCalled();
  });

  it('should warn that the linked official report goes with the agenda', async () => {
    await clickDelete({ ...AGENDA, isLinkedToOfficialReport: true });

    const { content } = waitForConfirmation.mock.calls[0][0];
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        {content}
      </IntlProvider>,
    );

    expect(screen.getByText('Cela entraînera la suppression du PV lié.')).toBeInTheDocument();
  });
});
