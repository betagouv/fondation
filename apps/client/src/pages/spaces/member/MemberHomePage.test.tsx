import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { frFormat } from '@/i18n/formats';

import { MemberHomePage } from './MemberHomePage';

const refetch = vi.fn();
const useListMemberGdsSessions = vi.hoisted(() => vi.fn());

vi.mock('@queries/auth.queries', () => ({
  useUser: () => ({ user: { civility: 'Madame BASSELIN', id: 'member' } }),
}));
vi.mock('@queries/members.queries', () => ({ useListMemberGdsSessions }));

function renderPage() {
  return render(
    <MemoryRouter>
      <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
        <MemberHomePage />
      </IntlProvider>
    </MemoryRouter>,
  );
}

describe('MemberHomePage', () => {
  beforeEach(() => {
    useListMemberGdsSessions.mockReturnValue({ data: { items: [] }, isError: false });
  });

  afterEach(() => vi.useRealTimers());

  it.each([
    [10, 'Bonjour, Madame BASSELIN'],
    [20, 'Bonsoir, Madame BASSELIN'],
  ])('greets the member by their civility at %i h', (hour, greeting) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 20, hour));
    renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(greeting);
  });

  it('works on the Garde des Sceaux while the CSM is under construction', () => {
    renderPage();

    expect(screen.getByRole('tab', { name: 'Garde des Sceaux' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'CSM (en construction)' })).toBeDisabled();
    expect(screen.getByRole('tabpanel', { name: 'Garde des Sceaux' })).toHaveTextContent(
      'Aucune session en cours',
    );
  });

  it('says the sessions are loading until they come', () => {
    useListMemberGdsSessions.mockReturnValue({ data: undefined, isError: false });
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Chargement des sessions en cours...');
  });

  it('should pass basic accessibility', async () => {
    useListMemberGdsSessions.mockReturnValue({
      data: {
        items: [
          {
            date: { day: 20, month: 2, year: 2028 },
            fileCount: 2,
            formation: 'PARQUET',
            id: 'abc',
            isAffected: true,
            name: 'Transparence ABC',
            propositionCount: 9,
            reportCounts: { IN_PROGRESS: 1, NEW: 1, READY_TO_SUPPORT: 0, SUPPORTED: 0 },
          },
        ],
      },
      isError: false,
    });
    const { container } = renderPage();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('offers to retry when the sessions fail to load', async () => {
    useListMemberGdsSessions.mockReturnValue({ isError: true, isRefetching: false, refetch });
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(refetch).toHaveBeenCalled();
  });
});
