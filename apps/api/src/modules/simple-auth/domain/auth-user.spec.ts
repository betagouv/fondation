import * as bcrypt from 'bcrypt';

import { AuthPassword } from './auth-password';
import {
  AdminOutsideSecretariat,
  AuthUser,
  AuthUserNotAuthentifiable,
  AuthUserRegistered,
  DeactivatedUserNotImpersonable,
} from './auth-user';

describe('AuthUser', () => {
  const now = new Date('2026-10-20T09:00:00Z');

  it('should refuse to authenticate a deactivated user with the right password', async () => {
    const password = await bcrypt.hash('secret', 4);
    const user = AuthUser.from({ id: 'user-1', password, status: 'DEACTIVATED' });

    await expect(user.authenticate({ now, plainPassword: 'secret', type: 'password' })).rejects.toThrow(
      AuthUserNotAuthentifiable,
    );
    expect(user.messages).toEqual([]);
  });

  describe('registration', () => {
    const registration = {
      email: 'agent@example.fr',
      firstName: 'Agent',
      gender: 'FEMALE',
      lastName: 'Secrétariat',
      password: AuthPassword.from('hash'),
    } as const;

    it('should register an admin of the general secretariat', async () => {
      const user = await AuthUser.register({
        ...registration,
        isAdmin: true,
        role: 'ADJOINT_SECRETAIRE_GENERAL',
      });

      expect(user.messages).toEqual([expect.objectContaining({ isAdmin: true })]);
      expect(user.messages[0]).toBeInstanceOf(AuthUserRegistered);
    });

    it('should refuse the admin right to a member', async () => {
      await expect(
        AuthUser.register({ ...registration, isAdmin: true, role: 'MEMBRE_COMMUN' }),
      ).rejects.toThrow(AdminOutsideSecretariat);
    });
  });

  it('should refuse to impersonate a deactivated user', () => {
    const admin = AuthUser.from({ id: 'admin-1', password: '', status: 'ACTIVE' });
    const target = AuthUser.from({ id: 'user-1', password: '', status: 'DEACTIVATED' });

    expect(() => admin.impersonate({ authSessionId: 'session-1', now, target })).toThrow(
      DeactivatedUserNotImpersonable,
    );
  });
});
