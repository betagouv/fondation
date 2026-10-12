import { afterEach, describe, expect, it, vi } from 'vitest';

import { AUTHORIZED_ROLES } from '../constants/authorized-roles.constants';
import { sessionQueryOptions } from '@queries/auth.queries';
import { queryClient } from '@queries/query-client';

import { isAuthorized, roleGuard } from './role-guard';

describe('isAuthorized', () => {
  it('rejects an anonymous user', () => {
    expect(isAuthorized(null, AUTHORIZED_ROLES.MEMBER)).toBe(false);
    expect(isAuthorized(undefined, AUTHORIZED_ROLES.ALL)).toBe(false);
  });

  it('rejects a role outside the authorized ones', () => {
    expect(isAuthorized({ role: 'MEMBRE_COMMUN' }, AUTHORIZED_ROLES.SG)).toBe(false);
    expect(isAuthorized({ role: 'ADJOINT_SECRETAIRE_GENERAL' }, AUTHORIZED_ROLES.MEMBER)).toBe(false);
  });

  it('accepts an authorized role', () => {
    expect(isAuthorized({ role: 'MEMBRE_DU_SIEGE' }, AUTHORIZED_ROLES.MEMBER)).toBe(true);
    expect(isAuthorized({ role: 'ADJOINT_SECRETAIRE_GENERAL' }, AUTHORIZED_ROLES.SG)).toBe(true);
  });

  it('always accepts the admin, even with an empty allowlist', () => {
    expect(isAuthorized({ role: 'ADMIN' }, AUTHORIZED_ROLES.NONE)).toBe(true);
  });
});

describe('roleGuard', () => {
  const member = {
    id: '5f6478c1-46a1-4b64-8cbd-4a0d67101d7e',
    role: 'MEMBRE_DU_SIEGE' as const,
    firstName: 'Ada',
    lastName: 'Lovelace',
    isImpersonated: false,
    civility: 'Madame LOVELACE',
  };

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

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
