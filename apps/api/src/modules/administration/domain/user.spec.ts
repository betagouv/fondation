import { AdminUserRole } from './admin-user-role';
import { AdminUserTitle } from './admin-user-title';
import {
  CantDeactivateOwnAccount,
  EmailAlreadyTaken,
  User,
  UserDeactivated,
  UserDisplayTitleUpdated,
  UserEmailUpdated,
  UserReactivated,
  UserRoleUpdated,
  UsersUntitled,
} from './user';

describe('User', () => {
  const baseProps = {
    id: 'user-1',
    role: AdminUserRole.from({
      duty: null,
      role: 'ADJOINT_SECRETAIRE_GENERAL',
      title: null,
    }),
    status: 'ACTIVE' as const,
  };

  it('should update email', () => {
    const user = User.from(baseProps);
    user.updateEmail({ email: 'new@email.com', isTakenByAnotherUser: false });

    expect(user.messages).toContainEqual(new UserEmailUpdated(user.id, 'new@email.com'));
  });

  it('should refuse the email of another user', () => {
    const user = User.from(baseProps);

    expect(() => user.updateEmail({ email: 'taken@email.com', isTakenByAnotherUser: true })).toThrow(
      EmailAlreadyTaken,
    );
  });

  it('should update the display title', () => {
    const user = User.from(baseProps);
    user.updateDisplayTitle('Conseiller référendaire');
    expect(user.messages).toContainEqual(new UserDisplayTitleUpdated(user.id, 'Conseiller référendaire'));
  });

  it('should update the title of a non titled user', () => {
    const user = User.from({
      ...baseProps,
      role: AdminUserRole.from({
        duty: null,
        role: 'ADJOINT_SECRETAIRE_GENERAL',
        title: null,
      }),
    });

    user.updateRole('FIRST_SECRETARY');

    expect(user.messages).toContainEqual(
      new UsersUntitled(user.id, 'FIRST_SECRETARY', AdminUserTitle.from('SECRETARY')),
    );

    expect(user.messages).toContainEqual(
      new UserRoleUpdated(
        user.id,
        AdminUserRole.from({
          duty: 'SECRETARY',
          role: 'ADJOINT_SECRETAIRE_GENERAL',
          title: 'FIRST_SECRETARY',
        }),
      ),
    );
  });

  it('should remove the title of a titled user', () => {
    const user = User.from({
      ...baseProps,
      role: AdminUserRole.from({
        duty: 'PRESIDENT',
        role: 'MEMBRE_COMMUN',
        title: 'PRESIDENT_PARQUET',
      }),
    });

    user.updateRole('MEMBRE_COMMUN');

    expect(user.messages).not.toContainEqual(expect.any(UsersUntitled));
    expect(user.messages).toContainEqual(
      new UserRoleUpdated(
        user.id,
        AdminUserRole.from({
          duty: null,
          role: 'MEMBRE_COMMUN',
          title: null,
        }),
      ),
    );
  });

  describe('deactivation', () => {
    const now = new Date('2026-10-20T09:00:00Z');

    it('should deactivate an active user', () => {
      const user = User.from(baseProps);
      user.deactivate({ actorId: 'admin-1', now });

      expect(user.messages).toEqual([new UserDeactivated(user.id, now, 'admin-1')]);
    });

    it('should refuse to let an admin deactivate their own account', () => {
      const user = User.from(baseProps);

      expect(() => user.deactivate({ actorId: user.id, now })).toThrow(CantDeactivateOwnAccount);
      expect(user.canDeactivate(user.id)).toBe(false);
    });

    it('should leave a deactivated user as is when deactivated again', () => {
      const user = User.from({ ...baseProps, status: 'DEACTIVATED' });
      user.deactivate({ actorId: 'admin-1', now });

      expect(user.messages).toEqual([]);
    });

    it('should reactivate a deactivated user', () => {
      const user = User.from({ ...baseProps, status: 'DEACTIVATED' });
      user.reactivate();

      expect(user.messages).toEqual([new UserReactivated(user.id)]);
    });

    it('should leave an active user as is when reactivated', () => {
      const user = User.from(baseProps);
      user.reactivate();

      expect(user.messages).toEqual([]);
    });
  });
});
