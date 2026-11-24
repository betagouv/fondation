import { renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { generatePath, MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ROUTE_PATHS, SESSION_SPACES, type SessionSpace } from './route-path.utils';
import { useSessionBreadcrumbRoot } from './transparences-breadcrumb.utils';

function sessionRootOf(space: SessionSpace, session: { isArchived: boolean }) {
  const wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter initialEntries={[generatePath(SESSION_SPACES[space].session, { sessionId: 'session-1' })]}>
      <IntlProvider defaultLocale="fr" locale="fr">
        {children}
      </IntlProvider>
    </MemoryRouter>
  );
  const { result } = renderHook(() => useSessionBreadcrumbRoot(space), { wrapper });
  return result.current(session);
}

describe('useSessionBreadcrumbRoot', () => {
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
