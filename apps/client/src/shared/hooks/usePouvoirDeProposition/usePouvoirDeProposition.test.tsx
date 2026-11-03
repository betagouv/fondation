import { renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

import { usePouvoirDeProposition } from './usePouvoirDeProposition';

function pouvoirOn(pathname: string) {
  return renderHook(() => usePouvoirDeProposition(), {
    wrapper: (props: PropsWithChildren) => (
      <MemoryRouter initialEntries={[pathname]}>{props.children}</MemoryRouter>
    ),
  }).result.current;
}

afterEach(() => {
  sessionStorage.clear();
});

describe('usePouvoirDeProposition', () => {
  it('keeps the GDS on a common page opened from the GDS', () => {
    pouvoirOn(ROUTE_PATHS.SG.MANAGE_SESSION);

    expect(pouvoirOn(ROUTE_PATHS.SG.MAGISTRAT_SEARCH)).toBe('GDS');
    expect(pouvoirOn(ROUTE_PATHS.ADMIN.USERS)).toBe('GDS');
  });

  it('shows a common page opened from the home outside any pouvoir', () => {
    pouvoirOn(ROUTE_PATHS.SG.MANAGE_SESSION);
    pouvoirOn(ROUTE_PATHS.SG.DASHBOARD);

    expect(pouvoirOn(ROUTE_PATHS.SG.MAGISTRAT_SEARCH)).toBeNull();
    expect(pouvoirOn(ROUTE_PATHS.ACCOUNT)).toBeNull();
  });

  it('never gives a pouvoir to a member, even in a tab opened from the secretariat', () => {
    pouvoirOn(ROUTE_PATHS.SG.MANAGE_SESSION);
    pouvoirOn(ROUTE_PATHS.TRANSPARENCES.DASHBOARD);

    expect(pouvoirOn(ROUTE_PATHS.ACCOUNT)).toBeNull();
  });
});
