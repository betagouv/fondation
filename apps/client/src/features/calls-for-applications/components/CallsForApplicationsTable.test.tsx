import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

function listed(): never {
  return {
    data: {
      currentPageIndex: 1,
      items: [],
      statuses: [],
      totalCount: 0,
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
          <CallsForApplicationsTable filtersSlot={null} period="PAST" />
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
            years: [String(new Date().getFullYear())],
          }),
        }),
      ),
    );
  });

  it('asks the API to sort by the column picked, and leaves the type unsortable', async () => {
    const list = vi.spyOn($api.callsForApplications, 'listCallsForApplications').mockResolvedValue(listed());
    renderTable();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Date limite' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ query: expect.objectContaining({ sortBy: 'deadline' }) }),
      ),
    );
    expect(screen.queryByRole('button', { name: "Type d'appel" })).not.toBeInTheDocument();
  });

  it('says there is no call yet rather than that the filters match none', async () => {
    vi.spyOn($api.callsForApplications, 'listCallsForApplications').mockResolvedValue(listed());
    renderTable();

    expect(await screen.findByText('Aucun appel à candidatures')).toBeInTheDocument();
  });
});
