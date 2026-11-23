import { afterEach, describe, expect, it, vi } from 'vitest';

import { AUTHORIZED_ROLES } from '../constants/authorized-roles.constants';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { sessionQueryOptions } from '@queries/auth.queries';
import { queryClient } from '@queries/query-client';

import { capabilityGuard, isAuthorized, roleGuard } from './role-guard';

describe('isAuthorized', () => {
  it('rejects an anonymous user', () => {
    expect(isAuthorized(null, AUTHORIZED_ROLES.MEMBER)).toBe(false);
    expect(isAuthorized(undefined, AUTHORIZED_ROLES.ALL)).toBe(false);
  });

  it('rejects a role outside the authorized ones', () => {
    expect(isAuthorized({ isAdmin: false, role: 'MEMBRE_COMMUN' }, AUTHORIZED_ROLES.SG)).toBe(false);
    expect(
      isAuthorized({ isAdmin: false, role: 'ADJOINT_SECRETAIRE_GENERAL' }, AUTHORIZED_ROLES.MEMBER),
    ).toBe(false);
  });

  it('accepts an authorized role', () => {
    expect(isAuthorized({ isAdmin: false, role: 'MEMBRE_DU_SIEGE' }, AUTHORIZED_ROLES.MEMBER)).toBe(true);
    expect(isAuthorized({ isAdmin: false, role: 'ADJOINT_SECRETAIRE_GENERAL' }, AUTHORIZED_ROLES.SG)).toBe(
      true,
    );
  });

  it('always accepts the admin, even with an empty allowlist', () => {
    expect(isAuthorized({ isAdmin: true, role: 'ADJOINT_SECRETAIRE_GENERAL' }, AUTHORIZED_ROLES.NONE)).toBe(
      true,
    );
  });
});

const member = {
  canManageApiClients: false,
  canManageTechnicalAccounts: false,
  civility: 'Madame LOVELACE',
  displayedRole: { group: 'MEMBER' as const, id: 'MEMBRE_SIEGE' as const, label: 'Membre du siège' },
  email: 'ada.lovelace@justice.fr',
  firstName: 'Ada',
  formation: 'SIEGE' as const,
  gender: 'FEMALE' as const,
  id: '5f6478c1-46a1-4b64-8cbd-4a0d67101d7e',
  isAdmin: false,
  isImpersonated: false,
  lastName: 'Lovelace',
  passwordChange: 'ALLOWED' as const,
  role: 'MEMBRE_DU_SIEGE' as const,
};

afterEach(() => {
  vi.restoreAllMocks();
  queryClient.clear();
});

describe('roleGuard', () => {
  it('lets an authorized user through', async () => {
    vi.spyOn(queryClient, 'ensureQueryData').mockResolvedValue(member);

    await expect(roleGuard(AUTHORIZED_ROLES.MEMBER)()).resolves.toBeNull();
  });

  it('redirects an unauthenticated user to the login page', async () => {
    vi.spyOn(queryClient, 'ensureQueryData').mockResolvedValue(null);

    const response = await roleGuard(AUTHORIZED_ROLES.MEMBER)();

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(302);
  });

  it('keeps the cached session on a technical error', async () => {
    vi.spyOn(queryClient, 'ensureQueryData').mockRejectedValue(new Error('network down'));
    queryClient.setQueryData(sessionQueryOptions.queryKey, member);

    await expect(roleGuard(AUTHORIZED_ROLES.MEMBER)()).resolves.toBeNull();
  });

  it('rethrows a technical error when no session is cached', async () => {
    vi.spyOn(queryClient, 'ensureQueryData').mockRejectedValue(new Error('network down'));

    await expect(roleGuard(AUTHORIZED_ROLES.MEMBER)()).rejects.toThrow('network down');
  });
});

describe('capabilityGuard', () => {
  it('lets an admin who has the capability through', async () => {
    vi.spyOn(queryClient, 'ensureQueryData').mockResolvedValue({
      ...member,
      canManageApiClients: true,
      isAdmin: true,
    });

    await expect(capabilityGuard('canManageApiClients')()).resolves.toBeNull();
  });

  it('sends an admin without the capability back to the administration', async () => {
    vi.spyOn(queryClient, 'ensureQueryData').mockResolvedValue({ ...member, isAdmin: true });

    const response = await capabilityGuard('canManageApiClients')();

    expect((response as Response).headers.get('Location')).toBe(ROUTE_PATHS.ADMIN.USERS);
  });
});
