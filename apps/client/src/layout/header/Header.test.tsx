import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { generatePath, MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { frFormat } from '@/i18n/formats';
import { ArchivedSessionContext } from '@/shared/context/archived-session';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { authKeys } from '@queries/auth.queries';
import { sessionKeys } from '@queries/nomination-sessions.queries';

import { AppHeader } from './Header';

function renderHeader(pathname: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(authKeys.introspectSession(), {
    displayedRole: { label: 'Secrétaire générale adjointe' },
    firstName: 'Sophie',
    id: 'sg-1',
    lastName: 'Bernard',
    role: 'ADJOINT_SECRETAIRE_GENERAL',
  });
  client.setQueryData(sessionKeys.countUsersNewSessions(), { count: 0 });

  return render(
    <QueryClientProvider client={client}>
      <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
        <ArchivedSessionContext value={{ isArchived: false, setIsArchived: () => {} }}>
          <MemoryRouter initialEntries={[pathname]}>
            <AppHeader />
          </MemoryRouter>
        </ArchivedSessionContext>
      </IntlProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  sessionStorage.clear();
});

describe('AppHeader', () => {
  it.each([
    ROUTE_PATHS.SG.GDS.PRESENTATIONS_NEW,
    generatePath(ROUTE_PATHS.SG.GDS.PRESENTATIONS_UPDATE, { planId: 'plan-1' }),
    generatePath(ROUTE_PATHS.SG.GDS.PRESENTATIONS_EDIT, { planId: 'plan-1' }),
  ])('highlights Restitutions on the notice page %s', (pathname) => {
    renderHeader(pathname);

    expect(screen.getByRole('link', { name: 'Restitutions' })).toHaveAttribute('aria-current', 'page');
  });

  it.each([
    ROUTE_PATHS.SG.DASHBOARD,
    ROUTE_PATHS.SG.GDS.MANAGE_SESSION,
    ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES,
  ])('offers Gérer les membres on %s', (pathname) => {
    renderHeader(pathname);

    expect(screen.getByRole('link', { name: 'Gérer les membres' })).toBeInTheDocument();
  });
});
