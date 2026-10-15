import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import type { ComponentProps } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';

import { ArchivedSessions } from './ArchivedSessions';

class NoopObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
}
vi.stubGlobal('IntersectionObserver', NoopObserver);
vi.stubGlobal('ResizeObserver', NoopObserver);

vi.mock('@queries/archived-nomination-sessions.queries', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useInfiniteArchivedGdsNominationSessionsQuery: () => ({
    data: {
      items: [
        {
          archivedAt: '2026-03-12T10:00:00.000Z',
          date: { day: 4, month: 2, year: 2026 },
          formation: 'SIEGE',
          id: 'session-1',
          name: 'Transparence du 4 février 2026',
          proposingAuthority: { id: 'GARDE_DES_SCEAUX', label: 'Garde des Sceaux' },
          typeDeSaisine: { id: 'TRANSPARENCE_GDS', label: 'Transparence' },
        },
      ],
      totalCount: 1,
    },
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
  }),
}));

function renderArchivedSessions(
  props: ComponentProps<typeof ArchivedSessions>,
  onUrlUpdate: OnUrlUpdateFunction = () => {},
) {
  render(
    <MemoryRouter>
      <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
        <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
          <ArchivedSessions {...props} />
        </IntlProvider>
      </NuqsTestingAdapter>
    </MemoryRouter>,
  );
}

describe('ArchivedSessions', () => {
  it('should filter by formation and open a session in the secretariat space', () => {
    renderArchivedSessions({ space: 'SG', withFormationFilter: true });

    expect(screen.getByRole('button', { name: /Formation/ })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Transparence du 4 février 2026' })).toHaveAttribute(
      'href',
      '/secretariat-general/session/session-1',
    );
  });

  it('should keep the searched name in the address', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderArchivedSessions({ space: 'SG', withFormationFilter: true }, onUrlUpdate);

    await userEvent.type(screen.getByPlaceholderText('Rechercher une session'), 'février');

    await waitFor(() => expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get('q')).toBe('février'), {
      timeout: 2000,
    });
  });
});
