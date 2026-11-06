import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { ToastProvider } from '@/shared/ui/toast';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';
import * as $api from '@api/sdk';
import type { SessionNominationFileLockedReason } from '@queries/nomination-sessions.queries';

import { SgSessionFilesTable } from './SgSessionFilesTable';

class NoopObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
}
vi.stubGlobal('ResizeObserver', NoopObserver);

function listFiles(lockedReason: SessionNominationFileLockedReason) {
  vi.spyOn($api.sessions, 'listNominationFiles').mockResolvedValue({
    data: {
      items: [
        makeSessionNominationFile({
          content: { lockedReason, nomMagistrat: 'BOURDIEU Pierre' },
          id: 'file-1',
        }),
        makeSessionNominationFile({ content: { nomMagistrat: 'HARENDT Anna' }, id: 'file-2' }),
      ],
      totalCount: 2,
    },
  } as Awaited<ReturnType<typeof $api.sessions.listNominationFiles>>);
}

function renderTable() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <MemoryRouter>
        <NuqsTestingAdapter>
          <QueryClientProvider client={client}>
            <ToastProvider>
              <ConfirmModalProvider>
                <SgSessionFilesTable
                  formation="SIEGE"
                  headerSlot={document.body}
                  outcomes={makeSessionOutcomes('SIEGE')}
                  scrollsWithPage
                  sessionId="session-1"
                />
              </ConfirmModalProvider>
            </ToastProvider>
          </QueryClientProvider>
        </NuqsTestingAdapter>
      </MemoryRouter>
    </IntlProvider>,
  );

  return { reload: () => client.invalidateQueries() };
}

describe('SgSessionFilesTable', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should drop from the selection a file frozen since it was checked, for good', async () => {
    listFiles(null);
    const { reload } = renderTable();

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Sélectionner la ligne 1' }));
    expect(screen.getByText('1 proposition sélectionnée sur 2')).toBeVisible();

    listFiles('REPORTED');
    await reload();
    expect(await screen.findByRole('checkbox', { name: /^Ligne 1 : / })).toBeDisabled();
    expect(screen.queryByText(/sélectionnée/)).toBeNull();

    listFiles(null);
    await reload();
    expect(await screen.findByRole('checkbox', { name: 'Sélectionner la ligne 1' })).not.toBeChecked();
  });

  it('should drop from the selection a file frozen since it was checked, once a bulk action is refused', async () => {
    listFiles(null);
    renderTable();

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Sélectionner la ligne 1' }));
    listFiles('REPORTED');
    vi.spyOn($api.sessions, 'updateNominationFilesPriorities').mockRejectedValue(new Error('refused'));
    await userEvent.click(screen.getByRole('button', { name: /Définir une priorité/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Outre-mer' }));

    expect(await screen.findByRole('checkbox', { name: /^Ligne 1 : / })).toBeDisabled();
    expect(screen.queryByText(/sélectionnée/)).toBeNull();
  });
});
