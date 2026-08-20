import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DocActionDetails } from './DocActionDetails';

const openAgenda = vi.fn();
const openOfficialReport = vi.fn();
const pushAlert = vi.fn();

vi.mock('@queries/agenda.queries', () => ({
  useDetailsSessionAgendaMutation: () => ({
    mutateAsync: openAgenda,
    isPending: false,
  }),
  useDetailsSessionOfficialReportsMutation: () => ({
    mutateAsync: openOfficialReport,
    isPending: false,
  }),
}));

vi.mock('@/shared/context/alerts', () => ({
  useAlerts: () => ({ pushAlert }),
}));

function renderDocActionDetails(setIsActing = vi.fn()) {
  const replace = vi.fn();
  const close = vi.fn();
  vi.spyOn(window, 'open').mockReturnValue({
    close,
    location: { replace },
  } as unknown as Window);

  const { unmount } = render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <DocActionDetails
        disabled={false}
        doc={{
          id: 'agenda-1',
          type: 'agenda',
          name: 'Ordre du jour du 12 mars',
          isLinkedToOfficialReport: false,
        }}
        sessionId="session-1"
        setIsActing={setIsActing}
      />
    </IntlProvider>,
  );

  return { close, replace, unmount };
}

describe('DocActionDetails', () => {
  beforeEach(() => {
    openAgenda.mockReset();
    openOfficialReport.mockReset();
    pushAlert.mockClear();
  });

  it('should ask for the agenda document when its name is clicked', async () => {
    openAgenda.mockResolvedValue({
      id: 'agenda-1',
      url: 'https://example.fr/doc.pdf',
    });

    const { replace } = renderDocActionDetails();

    await userEvent.click(screen.getByRole('button', { name: 'Ordre du jour du 12 mars' }));

    expect(openAgenda).toHaveBeenCalledWith({
      agendaId: 'agenda-1',
      sessionId: 'session-1',
    });
    await waitFor(() => expect(replace).toHaveBeenCalledWith('https://example.fr/doc.pdf'));
  });

  it('should open the document even when the request outlives the component', async () => {
    let resolveDetails: (details: { id: string; url: string }) => void;
    openAgenda.mockReturnValue(new Promise((resolve) => (resolveDetails = resolve)));

    const setIsActing = vi.fn();
    const { replace, unmount } = renderDocActionDetails(setIsActing);

    await userEvent.click(screen.getByRole('button', { name: 'Ordre du jour du 12 mars' }));
    unmount();

    resolveDetails!({ id: 'agenda-1', url: 'https://example.fr/doc.pdf' });

    await waitFor(() => expect(replace).toHaveBeenCalledWith('https://example.fr/doc.pdf'));
    expect(setIsActing).toHaveBeenLastCalledWith(false);
  });

  it('should tell the user when the document cannot be opened', async () => {
    openAgenda.mockRejectedValue(new Error('generation failed'));

    const setIsActing = vi.fn();
    const { close } = renderDocActionDetails(setIsActing);

    await userEvent.click(screen.getByRole('button', { name: 'Ordre du jour du 12 mars' }));

    await waitFor(() =>
      expect(pushAlert).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' })),
    );
    expect(close).toHaveBeenCalled();
    expect(setIsActing).toHaveBeenLastCalledWith(false);
  });
});
