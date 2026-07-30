import { describe, expect, it } from 'vitest';

import { AUTHORIZED_ROLES } from '../constants/authorized-roles.constants';

import { isAuthorized } from './role-guard';

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
