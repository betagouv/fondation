import * as bcrypt from 'bcrypt';

import { AuthPassword } from './auth-password';
import {
  AuthUser,
  AuthUserNotAuthentifiable,
  AuthUserPasswordChanged,
  AuthUserSessionsRevoked,
  CannotChangePassword,
  UserNotImpersonable,
  WrongCurrentPassword,
} from './auth-user';

describe('AuthUser', () => {
  const now = new Date('2026-10-20T09:00:00Z');

  it('should refuse to authenticate a deactivated user with the right password', async () => {
    const password = await bcrypt.hash('secret', 4);
    const user = AuthUser.from({ id: 'user-1', password, role: 'MEMBRE_DU_SIEGE', status: 'DEACTIVATED' });

    await expect(user.authenticate({ now, plainPassword: 'secret', type: 'password' })).rejects.toThrow(
      AuthUserNotAuthentifiable,
    );
    expect(user.messages).toEqual([]);
  });

  describe('password change', () => {
    const user = async () =>
      AuthUser.from({
        id: 'user-1',
        password: await bcrypt.hash('current', 4),
        role: 'MEMBRE_DU_SIEGE',
        status: 'ACTIVE',
      });
    const command = () => ({
      currentPassword: 'current',
      hash: vi.fn(async (plain: string) => AuthPassword.from(`hash of ${plain}`)),
      isImpersonated: false,
      keptSessionId: 'session-1',
      newPassword: 'new password',
    });

    it('should change the password and revoke every other session', async () => {
      const changing = await user();

      await changing.changePassword(command());

      expect(changing.messages).toEqual([
        new AuthUserPasswordChanged('user-1', 'hash of new password'),
        new AuthUserSessionsRevoked('user-1', 'session-1'),
      ]);
    });

    it('should refuse a wrong current password without hashing the new one', async () => {
      const changing = await user();
      const wrong = { ...command(), currentPassword: 'wrong' };

      await expect(changing.changePassword(wrong)).rejects.toThrow(WrongCurrentPassword);
      expect(wrong.hash).not.toHaveBeenCalled();
      expect(changing.messages).toEqual([]);
    });

    it('should refuse to change the password while impersonating', async () => {
      const changing = await user();

      await expect(changing.changePassword({ ...command(), isImpersonated: true })).rejects.toThrow(
        CannotChangePassword,
      );
      expect(changing.messages).toEqual([]);
    });
  });

  describe('impersonation', () => {
    const admin = AuthUser.from({
      id: 'admin-1',
      password: '',
      role: 'ADJOINT_SECRETAIRE_GENERAL',
      status: 'ACTIVE',
    });

    it('should refuse to impersonate a deactivated member', () => {
      const target = AuthUser.from({
        id: 'user-1',
        password: '',
        role: 'MEMBRE_DU_SIEGE',
        status: 'DEACTIVATED',
      });

      expect(() => admin.impersonate({ authSessionId: 'session-1', now, target })).toThrow(
        UserNotImpersonable,
      );
    });

    it('should refuse to impersonate someone from the secretariat, whose screens are those of the admin', () => {
      const target = AuthUser.from({
        id: 'user-1',
        password: '',
        role: 'ADJOINT_SECRETAIRE_GENERAL',
        status: 'ACTIVE',
      });

      expect(() => admin.impersonate({ authSessionId: 'session-1', now, target })).toThrow(
        UserNotImpersonable,
      );
    });
  });
});
