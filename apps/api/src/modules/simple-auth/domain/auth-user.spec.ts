import * as bcrypt from 'bcrypt';

import { AuthPassword } from './auth-password';
import {
  AdminOutsideSecretariat,
  AuthUser,
  AuthUserNotAuthentifiable,
  AuthUserPasswordChanged,
  AuthUserRegistered,
  AuthUserSessionsRevoked,
  DeactivatedUserNotImpersonable,
  WrongCurrentPassword,
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

  describe('password change', () => {
    const user = async () =>
      AuthUser.from({ id: 'user-1', password: await bcrypt.hash('current', 4), status: 'ACTIVE' });
    const command = { keptSessionId: 'session-1', password: AuthPassword.from('new hash') };

    it('should change the password and revoke every other session', async () => {
      const changing = await user();

      await changing.changePassword({ ...command, currentPassword: 'current' });

      expect(changing.messages).toEqual([
        new AuthUserPasswordChanged('user-1', 'new hash'),
        new AuthUserSessionsRevoked('user-1', 'session-1'),
      ]);
    });

    it('should refuse a wrong current password', async () => {
      const changing = await user();

      await expect(changing.changePassword({ ...command, currentPassword: 'wrong' })).rejects.toThrow(
        WrongCurrentPassword,
      );
      expect(changing.messages).toEqual([]);
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
