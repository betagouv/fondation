import { AuthPassword } from './auth-password';
import { AuthUser, AuthUserNotAuthentifiable, DeactivatedUserNotImpersonable } from './auth-user';

describe('AuthUser', () => {
  const now = new Date('2026-10-20T09:00:00Z');

  it('should refuse to authenticate a deactivated user with the right password', async () => {
    const password = await AuthPassword.create('secret');
    const user = AuthUser.from({ id: 'user-1', password: password.toString(), status: 'DEACTIVATED' });

    await expect(user.authenticate({ now, plainPassword: 'secret', type: 'password' })).rejects.toThrow(
      AuthUserNotAuthentifiable,
    );
    expect(user.messages).toEqual([]);
  });

  it('should refuse to impersonate a deactivated user', () => {
    const admin = AuthUser.from({ id: 'admin-1', password: '', status: 'ACTIVE' });
    const target = AuthUser.from({ id: 'user-1', password: '', status: 'DEACTIVATED' });

    expect(() => admin.impersonate({ authSessionId: 'session-1', now, target })).toThrow(
      DeactivatedUserNotImpersonable,
    );
  });
});
