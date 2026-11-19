import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';

import { FollowedUpObservationsTable } from './FollowedUpObservationsTable';

class NoopObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
}
vi.stubGlobal('IntersectionObserver', NoopObserver);
vi.stubGlobal('ResizeObserver', NoopObserver);

const useInfiniteFollowedUpObservationsQuery = vi.hoisted(() =>
  vi.fn<(filters: object) => object>(() => ({
    data: { items: [], totalCount: 0 },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
  })),
);

vi.mock('@queries/observations.queries', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useInfiniteFollowedUpObservationsQuery,
}));

function renderTable(searchParams: string) {
  render(
    <MemoryRouter>
      <NuqsTestingAdapter searchParams={searchParams}>
        <QueryClientProvider client={new QueryClient()}>
          <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
            <FollowedUpObservationsTable />
          </IntlProvider>
        </QueryClientProvider>
      </NuqsTestingAdapter>
    </MemoryRouter>,
  );

  return useInfiniteFollowedUpObservationsQuery.mock.lastCall?.[0];
}

describe('FollowedUpObservationsTable', () => {
  it('should send only the years of a link edited by hand', () => {
    expect(renderTable('?filters=sessionYears:[2026,"abc","2025"]')).toMatchObject({
      sessionYears: ['2025'],
    });
  });

  it('should open on the observations still to track, unless the link holds an empty filter list', () => {
    expect(renderTable('')).toMatchObject({ trackingStatuses: ['IN_PROGRESS'] });
    expect(renderTable('?filters=')).toMatchObject({ trackingStatuses: [] });
  });
});
