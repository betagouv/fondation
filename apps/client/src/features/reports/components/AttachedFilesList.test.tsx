import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { AttachedFilesList } from './AttachedFilesList';

vi.mock('@/shared/context/confirm-modal', () => ({
  useConfirmModal: () => ({ waitForConfirmation: vi.fn() }),
}));
vi.mock('@/shared/hooks/useTab', () => ({ useTab: () => ({ openDeferred: vi.fn() }) }));
vi.mock('@/shared/ui/toast', () => ({ useToasts: () => ({ error: vi.fn() }) }));

function renderAttachments(visibility: 'PRIVATE' | 'VISIBLE' | null) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={new QueryClient()}>
        <AttachedFilesList
          attachments={[
            {
              addedAt: '2026-11-20T09:00:00.000Z',
              addedBy: null,
              id: 'file-1',
              name: 'avis.pdf',
              size: 1_000,
            },
          ]}
          isReadOnly
          onDelete={() => undefined}
          reportId="report-1"
          visibility={visibility}
        />
      </QueryClientProvider>
    </IntlProvider>,
  );
}

describe('AttachedFilesList', () => {
  it('lets the reporter open the attachments of their report', () => {
    renderAttachments('VISIBLE');

    expect(screen.getByRole('button', { name: 'avis' })).toBeEnabled();
  });

  it('keeps the attachments private from the admin impersonating the reporter', () => {
    renderAttachments('PRIVATE');

    expect(screen.getByText('Contenu privé')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'avis' })).toBeDisabled();
  });

  it('leaves the attachments closed to whoever reads the report without being its reporter', () => {
    renderAttachments(null);

    expect(
      screen.getByText('Seul le rapporteur peut ouvrir les pièces jointes de son rapport'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'avis' })).toBeDisabled();
  });
});
