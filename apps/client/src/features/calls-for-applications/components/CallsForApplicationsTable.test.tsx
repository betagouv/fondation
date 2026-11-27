import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { ToastProvider } from '@/shared/ui/toast';
import * as $api from '@api/sdk';
import type { ListedCallsForApplicationsDto } from '@api/types';

import { CallsForApplicationsTable } from './CallsForApplicationsTable';

class NoopObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
}
vi.stubGlobal('IntersectionObserver', NoopObserver);
vi.stubGlobal('ResizeObserver', NoopObserver);

function listed(items: ListedCallsForApplicationsDto['items'] = []): never {
  return {
    data: {
      currentPageIndex: 1,
      items,
      statuses: [],
      totalCount: items.length,
      types: [],
      years: [2026, 2025],
    } satisfies ListedCallsForApplicationsDto,
  } as never;
}

function renderTable() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={client}>
        <NuqsTestingAdapter hasMemory>
          <ToastProvider>
            <ConfirmModalProvider>
              <CallsForApplicationsTable filtersSlot={null} period="PAST" />
            </ConfirmModalProvider>
          </ToastProvider>
        </NuqsTestingAdapter>
      </QueryClientProvider>
    </IntlProvider>,
  );
}

describe('CallsForApplicationsTable', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens on the calls of the current year', async () => {
    const list = vi.spyOn($api.callsForApplications, 'listCallsForApplications').mockResolvedValue(listed());
    renderTable();

    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            period: 'PAST',
            statuses: [],
            types: [],
            years: [String(new Date().getFullYear())],
          }),
        }),
      ),
    );
  });

  it('asks the API to sort by the column picked and leaves the target unsortable', async () => {
    const list = vi.spyOn($api.callsForApplications, 'listCallsForApplications').mockResolvedValue(listed());
    renderTable();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Date limite' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ query: expect.objectContaining({ sortBy: 'deadline' }) }),
      ),
    );
    expect(screen.queryByRole('button', { name: 'Cible' })).not.toBeInTheDocument();
  });

  it('sums up under the target the courts for which a call adapts the guidelines', async () => {
    const auch = { id: 'TJ  AUCH', label: "Tribunal judiciaire d'Auch", type: 'JUDICIAL_COURT' } as const;
    vi.spyOn($api.callsForApplications, 'listCallsForApplications').mockResolvedValue(
      listed([
        {
          canChange: true,
          comment: null,
          createdOn: { day: 26, month: 11, year: 2026 },
          deadline: null,
          guidelinesAdaptations: [auch],
          guidelinesAdaptationsLabel: "Tribunal judiciaire d'Auch",
          history: [],
          id: 'call',
          publishedOn: null,
          status: { id: 'UNPUBLISHED', label: 'Non publié' },
          targetCourts: [auch],
          targetLabel: "Tribunal judiciaire d'Auch",
          targetPositions: [],
          type: { id: 'SPECIFIC', label: 'Spécifique' },
        },
      ]),
    );
    renderTable();

    expect(
      await screen.findByText(
        "Lignes directrices de gestion adaptées sur la durée d'affectation du poste actuel",
        { selector: 'span' },
      ),
    ).toBeInTheDocument();
  });

  it('says there is no call yet rather than that the filters match none', async () => {
    vi.spyOn($api.callsForApplications, 'listCallsForApplications').mockResolvedValue(listed());
    renderTable();

    expect(await screen.findByText('Aucun appel à candidatures')).toBeInTheDocument();
  });
});
