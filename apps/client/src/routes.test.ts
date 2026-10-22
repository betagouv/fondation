import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { LoaderFunction, LoaderFunctionArgs, RouteObject } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AUTHORIZED_ROLES } from '@/features/auth/constants/authorized-roles.constants';
import { queryClient } from '@queries/query-client';

import { routes } from './routes';

type View = { guards: LoaderFunction[]; path: string };
type Access = { isPublic: boolean; member: boolean; path: string; secretariat: boolean };

// only the loaders made by roleGuard run: they ignore the arguments the test cannot provide
const roleGuards = vi.hoisted(() => new WeakSet<LoaderFunction>());

vi.mock('@/features/auth/guards/role-guard', async (importOriginal) => {
  const { roleGuard, ...module } = await importOriginal<typeof import('@/features/auth/guards/role-guard')>();
  return {
    ...module,
    roleGuard: (authorizedRoles: readonly unknown[]) => {
      const guard = roleGuard(authorizedRoles);
      roleGuards.add(guard);
      return guard;
    },
  };
});

function collectViews(children: readonly RouteObject[], parent: View): View[] {
  return children.flatMap((route) => {
    if (route.path && !route.path.startsWith('/')) {
      throw new Error(`${route.path} is relative: its view would take the path of its parent`);
    }

    const path = route.path ?? parent.path;
    const guards =
      typeof route.loader === 'function' && roleGuards.has(route.loader)
        ? [...parent.guards, route.loader]
        : parent.guards;
    const isView = !!(route.Component || route.element || route.lazy) && !!(route.path || route.index);

    return [...(isView ? [{ guards, path }] : []), ...collectViews(route.children ?? [], { guards, path })];
  });
}

async function allows(view: View, user: { isAdmin: boolean; role: string } | null): Promise<boolean> {
  vi.spyOn(queryClient, 'ensureQueryData').mockResolvedValue(user);
  for (const guard of view.guards) {
    if ((await guard({} as LoaderFunctionArgs)) instanceof Response) return false;
  }
  return true;
}

async function accessOf(view: View): Promise<Access> {
  // one after the other: each check mocks the same session query
  const members = new Set<boolean>();
  for (const role of AUTHORIZED_ROLES.MEMBER as string[])
    members.add(await allows(view, { isAdmin: false, role }));
  if (members.size > 1) throw new Error(`${view.path} lets some members in but not all of them`);

  return {
    isPublic: await allows(view, null),
    member: [...members][0]!,
    path: view.path,
    secretariat: await allows(view, { isAdmin: false, role: 'ADJOINT_SECRETAIRE_GENERAL' }),
  };
}

function listedAccesses(listing: string): Access[] {
  const views = listing.split(/^## /m).find((part) => part.startsWith('Vues\n')) ?? '';
  const accesses: Access[] = [];
  let headers: string[] = [];
  let section = '';

  for (const line of views.split('\n')) {
    if (line.startsWith('### ')) section = line.slice(4);
    if (!line.startsWith('| ')) continue;

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (!cells[0]!.startsWith('`')) {
      if (cells.includes('Membre')) headers = cells;
      continue;
    }

    accesses.push({
      isPublic: section === 'Pages publiques',
      member: cells[headers.indexOf('Membre')]!.startsWith('✓'),
      path: cells[0]!.slice(1, -1),
      secretariat: cells[headers.indexOf('Secrétariat général')]!.startsWith('✓'),
    });
  }

  return accesses;
}

const byPath = (a: Access, b: Access) => a.path.localeCompare(b.path);

describe('routes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('match the views listed in docs/droits-par-role.md, with their roles', async () => {
    const listing = readFileSync(join(import.meta.dirname, '../../../docs/droits-par-role.md'), 'utf8');
    const views = new Map(collectViews(routes, { guards: [], path: '/' }).map((view) => [view.path, view]));

    const accesses: Access[] = [];
    for (const view of views.values()) accesses.push(await accessOf(view));

    expect(listedAccesses(listing).toSorted(byPath)).toEqual(accesses.toSorted(byPath));
  });
});
