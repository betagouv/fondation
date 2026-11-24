import { renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { generatePath, MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ROUTE_PATHS } from './route-path.utils';
import { useSessionBreadcrumbRoot } from './transparences-breadcrumb.utils';

const SG_SESSION_PATH = generatePath(ROUTE_PATHS.SG.GDS.SESSION_ID, { sessionId: 'session-1' });
const MEMBER_SESSION_PATH = generatePath(ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS, {
  sessionId: 'session-1',
});

function sessionRootOf(space: 'SG' | 'TRANSPARENCES', session: { isArchived: boolean }) {
  const wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter initialEntries={[space === 'SG' ? SG_SESSION_PATH : MEMBER_SESSION_PATH]}>
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
