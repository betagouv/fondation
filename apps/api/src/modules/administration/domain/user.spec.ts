import { AdminUserRole } from './admin-user-role';
import { AdminUserTitle } from './admin-user-title';
import { User, UserDisplayTitleUpdated, UserEmailUpdated, UserRoleUpdated, UsersUntitled } from './user';

describe('User', () => {
  const baseProps = {
    id: 'user-1',
    role: AdminUserRole.from({
      role: 'ADJOINT_SECRETAIRE_GENERAL',
      duty: null,
      title: null,
    }),
  };

  it('should update email', () => {
    const user = User.from(baseProps);
    user.updateEmail('new@email.com');

    expect(user.messages).toContainEqual(new UserEmailUpdated(user.id, 'new@email.com'));
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
        title: null,
        role: 'ADJOINT_SECRETAIRE_GENERAL',
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
          role: 'ADJOINT_SECRETAIRE_GENERAL',
          duty: 'SECRETARY',
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
        title: 'PRESIDENT_PARQUET',
        role: 'MEMBRE_COMMUN',
      }),
    });

    user.updateRole('MEMBRE_COMMUN');

    expect(user.messages).not.toContainEqual(expect.any(UsersUntitled));
    expect(user.messages).toContainEqual(
      new UserRoleUpdated(
        user.id,
        AdminUserRole.from({
          role: 'MEMBRE_COMMUN',
          duty: null,
          title: null,
        }),
      ),
    );
  });
});
