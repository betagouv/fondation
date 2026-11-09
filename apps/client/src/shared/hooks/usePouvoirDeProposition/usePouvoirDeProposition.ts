import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

const POUVOIRS_DE_PROPOSITION = ['CSM', 'GDS'] as const;
export type PouvoirDeProposition = (typeof POUVOIRS_DE_PROPOSITION)[number];

export const POUVOIR_DE_PROPOSITION_STORAGE_KEY = 'fondation:pouvoir-de-proposition';

/** null on the home, the login and the members' space, undefined on a page common to both pouvoirs, which follows the one it was opened from */
function pouvoirDePropositionOfPage(pathname: string): PouvoirDeProposition | null | undefined {
  if (pathname === ROUTE_PATHS.SG.DASHBOARD || pathname === ROUTE_PATHS.LOGIN) return null;
  // a tab opened to act as a member inherits the storage of the secretariat's tab, then lands in the members' space
  if (matchPath({ end: false, path: ROUTE_PATHS.TRANSPARENCES.DASHBOARD }, pathname)) return null;
  if (matchPath({ end: false, path: ROUTE_PATHS.SG.MAGISTRAT_SEARCH }, pathname)) return undefined;
  if (matchPath({ end: false, path: ROUTE_PATHS.SG.CSM.ROOT }, pathname)) return 'CSM';
  if (pathname.startsWith(`${ROUTE_PATHS.SG.DASHBOARD}/`)) return 'GDS';

  return undefined;
}

// per tab: a reload keeps it, a new tab only when the browser copies the storage, otherwise it shows the common pages
function storedPouvoirDeProposition(): PouvoirDeProposition | null {
  try {
    const stored = sessionStorage.getItem(POUVOIR_DE_PROPOSITION_STORAGE_KEY);
    return POUVOIRS_DE_PROPOSITION.find((pouvoir) => pouvoir === stored) ?? null;
  } catch {
    return null;
  }
}

function storePouvoirDeProposition(pouvoir: PouvoirDeProposition | null): void {
  try {
    if (pouvoir) sessionStorage.setItem(POUVOIR_DE_PROPOSITION_STORAGE_KEY, pouvoir);
    else sessionStorage.removeItem(POUVOIR_DE_PROPOSITION_STORAGE_KEY);
  } catch {
    // a browser refusing the storage only loses the pouvoir on the common pages
  }
}

export function usePouvoirDeProposition(): PouvoirDeProposition | null {
  const { pathname } = useLocation();
  const pagePouvoir = pouvoirDePropositionOfPage(pathname);

  useEffect(() => {
    if (pagePouvoir !== undefined) storePouvoirDeProposition(pagePouvoir);
  }, [pagePouvoir]);

  return pagePouvoir === undefined ? storedPouvoirDeProposition() : pagePouvoir;
}
