import { renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { generatePath, MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { ROUTE_PATHS, SESSION_SPACES, type SessionSpace } from './route-path.utils';
import { useSessionBreadcrumbRoot } from './transparences-breadcrumb.utils';

function sessionRootOf(
  space: SessionSpace,
  session: { isArchived: boolean },
  pathname = generatePath(SESSION_SPACES[space].session, { sessionId: 'session-1' }),
) {
  const wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter initialEntries={[pathname]}>
      <IntlProvider defaultLocale="fr" locale="fr">
        {children}
      </IntlProvider>
    </MemoryRouter>
  );
  const { result } = renderHook(() => useSessionBreadcrumbRoot(space), { wrapper });
  return result.current(session);
}

describe('useSessionBreadcrumbRoot', () => {
  // the pouvoir of the previous page lives in the tab's storage
  afterEach(() => sessionStorage.clear());

  it('leads the secretariat to a current session through its sessions', () => {
    expect(sessionRootOf('SG', { isArchived: false })).toEqual([
      { label: 'Accueil', to: ROUTE_PATHS.SG.DASHBOARD },
      { label: 'GDS', to: ROUTE_PATHS.SG.GDS.MANAGE_SESSION },
    ]);
  });

  it('leads the secretariat to an archived session through the archived sessions', () => {
    expect(sessionRootOf('SG', { isArchived: true })).toEqual([
      { label: 'Accueil', to: ROUTE_PATHS.SG.DASHBOARD },
      { label: 'GDS', to: ROUTE_PATHS.SG.GDS.MANAGE_SESSION },
      { label: 'Sessions archivées', to: ROUTE_PATHS.SG.GDS.ARCHIVED_SESSIONS },
    ]);
  });

  it('leads the secretariat through the GDS from a page common to both pouvoirs, opened in a new tab', () => {
    const summary = generatePath(ROUTE_PATHS.SUMMARY, { fileId: 'file-1', sessionId: 'session-1' });

    expect(sessionRootOf('SG', { isArchived: true }, summary)).toEqual([
      { label: 'Accueil', to: ROUTE_PATHS.SG.DASHBOARD },
      { label: 'GDS', to: ROUTE_PATHS.SG.GDS.MANAGE_SESSION },
      { label: 'Sessions archivées', to: ROUTE_PATHS.SG.GDS.ARCHIVED_SESSIONS },
    ]);
  });

  it('leads a member to a current session from the home', () => {
    expect(sessionRootOf('TRANSPARENCES', { isArchived: false })).toEqual([
      { label: 'Accueil', to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD },
    ]);
  });

  it('leads a member to an archived session through the archived sessions', () => {
    expect(sessionRootOf('TRANSPARENCES', { isArchived: true })).toEqual([
      { label: 'Accueil', to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD },
      { label: 'Sessions archivées', to: ROUTE_PATHS.TRANSPARENCES.ARCHIVED_SESSIONS },
    ]);
  });
});
