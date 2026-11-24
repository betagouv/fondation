import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
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
      targetJurisdictionTypes: [],
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
        <NuqsTestingAdapter>
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
            targetJurisdictionTypes: [],
            years: [String(new Date().getFullYear())],
          }),
        }),
      ),
    );
  });
});
