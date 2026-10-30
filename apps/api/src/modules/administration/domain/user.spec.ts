import { AdminUserRole } from './admin-user-role';
import { AdminUserTitle } from './admin-user-title';
import {
  CantDeactivateOwnAccount,
  CantGiveAdminAMemberRole,
  CantGiveTechnicalAccountThisRole,
  CantManageTechnicalAccounts,
  CantPromoteMemberToAdmin,
  CantResetPasswordOfDeactivatedAccount,
  EmailAlreadyTaken,
  User,
  UserDeactivated,
  UserDemotedFromAdmin,
  UserDisplayTitleUpdated,
  UserEmailUpdated,
  UserPromotedToAdmin,
  UserReactivated,
  UserRegistered,
  UserRoleUpdated,
  UserTechnicalAccountUpdated,
  UsersUntitled,
} from './user';

describe('User', () => {
  const baseProps = {
    id: 'user-1',
    isAdmin: false,
    isTechnical: false,
    role: AdminUserRole.from({
      duty: null,
      role: 'ADJOINT_SECRETAIRE_GENERAL',
      title: null,
    }),
    status: 'ACTIVE' as const,
  };

  describe('registration', () => {
    const registration = {
      email: 'Agent@Example.fr',
      firstName: 'Agent',
      gender: 'FEMALE',
      hashedPassword: 'hash',
      isAdmin: false,
      isTechnical: false,
      lastName: 'Secrétariat',
      now: new Date('2026-10-20T09:00:00Z'),
      registrar: User.from({ ...baseProps, id: 'admin-1', isAdmin: true }),
    } as const;
    const developer = User.from({ ...baseProps, id: 'developer-1', isAdmin: true, isTechnical: true });

    it('should give a new officer their whole role, duty included', () => {
      const role = AdminUserRole.ofNewAccount('OFFICER');

      const user = User.register({ ...registration, role });

      expect(user.messages).toEqual([
        new UserRegistered({
          ...registration,
          email: 'agent@example.fr',
          firstName: 'agent',
          lastName: 'secrétariat',
          registeredAt: registration.now,
          registeredBy: 'admin-1',
          role,
          userId: user.id,
        }),
        new UserRoleUpdated(user.id, role),
      ]);
    });

    it('should take the title of a new president back from its holder', () => {
      const role = AdminUserRole.ofNewAccount('PRESIDENT_SIEGE');

      const user = User.register({ ...registration, role });

      expect(user.messages).toEqual([
        new UsersUntitled(user.id, 'PRESIDENT_SIEGE', AdminUserTitle.from('MEMBRE_SIEGE')),
        expect.any(UserRegistered),
        new UserRoleUpdated(user.id, role),
      ]);
    });

    it('should give the admin right to a new account of the general secretariat', () => {
      const user = User.register({
        ...registration,
        isAdmin: true,
        role: AdminUserRole.ofNewAccount('OFFICER'),
      });

      expect(user.messages).toContainEqual(
        expect.objectContaining({ isAdmin: true, registeredBy: 'admin-1' }),
      );
    });

    it('should refuse the admin right to a new member', () => {
      expect(() =>
        User.register({ ...registration, isAdmin: true, role: AdminUserRole.ofNewAccount('MEMBRE_COMMUN') }),
      ).toThrow(CantPromoteMemberToAdmin);
    });

    it('should refuse to make a new member a technical account', () => {
      expect(() =>
        User.register({
          ...registration,
          isTechnical: true,
          role: AdminUserRole.ofNewAccount('MEMBRE_COMMUN'),
        }),
      ).toThrow(CantGiveTechnicalAccountThisRole);
    });

    it('should let a developer register a technical account', () => {
      const user = User.register({
        ...registration,
        isTechnical: true,
        registrar: developer,
        role: AdminUserRole.ofNewAccount('OFFICER'),
      });

      expect(user.messages).toContainEqual(
        expect.objectContaining({ isTechnical: true, registeredBy: 'developer-1' }),
      );
    });

    it('should let the CLI register the first technical account', () => {
      const user = User.register({
        ...registration,
        isTechnical: true,
        registrar: null,
        role: AdminUserRole.ofNewAccount('OFFICER'),
      });

      expect(user.messages).toContainEqual(
        expect.objectContaining({ isTechnical: true, registeredBy: null }),
      );
    });

    it('should refuse a technical account to an admin who is no developer', () => {
      expect(() =>
        User.register({ ...registration, isTechnical: true, role: AdminUserRole.ofNewAccount('OFFICER') }),
      ).toThrow(CantManageTechnicalAccounts);
    });

    it('should refuse a title to a new technical account', () => {
      expect(() =>
        User.register({
          ...registration,
          isTechnical: true,
          registrar: developer,
          role: AdminUserRole.ofNewAccount('FIRST_SECRETARY'),
        }),
      ).toThrow(CantGiveTechnicalAccountThisRole);
    });

    it('should keep a technical account in the untitled roles of the general secretariat', () => {
      const user = User.from({ ...baseProps, isTechnical: true });

      expect(user.assignableRoles()).toEqual(['SECRETARY', 'OFFICER']);
      expect(() => user.updateRole('MEMBRE_SIEGE')).toThrow(CantGiveTechnicalAccountThisRole);
      expect(() => user.updateRole('FIRST_SECRETARY')).toThrow(CantGiveTechnicalAccountThisRole);
    });

    it('should refuse an email another account already has', () => {
      expect(() => User.assertEmailFree(true)).toThrow(EmailAlreadyTaken);
    });
  });

  describe('technical account', () => {
    const now = new Date('2026-10-30T09:00:00Z');
    const developer = User.from({ ...baseProps, id: 'developer-1', isAdmin: true, isTechnical: true });

    it('should let a developer mark an agent as a technical account', () => {
      const user = User.from(baseProps);
      user.updateTechnicalAccount({ actor: developer, isTechnical: true, now });

      expect(user.messages).toEqual([new UserTechnicalAccountUpdated(user.id, true, now, 'developer-1')]);
    });

    it('should let a developer unmark a technical account', () => {
      const user = User.from({ ...baseProps, isTechnical: true });
      user.updateTechnicalAccount({ actor: developer, isTechnical: false, now });

      expect(user.messages).toEqual([new UserTechnicalAccountUpdated(user.id, false, now, 'developer-1')]);
    });

    it('should leave a technical account as is when marked again', () => {
      const user = User.from({ ...baseProps, isTechnical: true });
      user.updateTechnicalAccount({ actor: developer, isTechnical: true, now });

      expect(user.messages).toEqual([]);
    });

    it('should refuse to an admin who is no developer to mark an account', () => {
      const user = User.from(baseProps);
      const admin = User.from({ ...baseProps, id: 'admin-1', isAdmin: true });

      expect(() => user.updateTechnicalAccount({ actor: admin, isTechnical: true, now })).toThrow(
        CantManageTechnicalAccounts,
      );
    });

    it('should refuse to mark the holder of a title as a technical account', () => {
      const user = User.from({
        ...baseProps,
        role: AdminUserRole.from({
          duty: 'SECRETARY',
          role: 'ADJOINT_SECRETAIRE_GENERAL',
          title: 'FIRST_SECRETARY',
        }),
      });

      expect(() => user.updateTechnicalAccount({ actor: developer, isTechnical: true, now })).toThrow(
        CantGiveTechnicalAccountThisRole,
      );
    });

    it('should refuse to mark a member as a technical account', () => {
      const user = User.from({
        ...baseProps,
        role: AdminUserRole.from({ duty: null, role: 'MEMBRE_COMMUN', title: null }),
      });

      expect(() => user.updateTechnicalAccount({ actor: developer, isTechnical: true, now })).toThrow(
        CantGiveTechnicalAccountThisRole,
      );
    });
  });

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

  describe('admin rights', () => {
    const now = new Date('2026-10-21T09:00:00Z');
    const admin = { ...baseProps, isAdmin: true };

    it('should promote a deputy general secretary to admin', () => {
      const user = User.from(baseProps);
      user.promoteAdmin({ actorId: 'admin-1', now });

      expect(user.messages).toEqual([new UserPromotedToAdmin(user.id, now, 'admin-1')]);
    });

    it('should refuse to promote a member to admin', () => {
      const user = User.from({
        ...baseProps,
        role: AdminUserRole.from({ duty: null, role: 'MEMBRE_COMMUN', title: null }),
      });

      expect(() => user.promoteAdmin({ actorId: 'admin-1', now })).toThrow(CantPromoteMemberToAdmin);
    });

    it('should leave an admin as is when promoted again', () => {
      const user = User.from(admin);
      user.promoteAdmin({ actorId: 'admin-1', now });

      expect(user.messages).toEqual([]);
    });

    it('should demote an admin', () => {
      const user = User.from(admin);
      user.demoteAdmin({ actorId: 'admin-1', now });

      expect(user.messages).toEqual([new UserDemotedFromAdmin(user.id, now, 'admin-1')]);
    });

    it('should refuse to give an admin the role of a member', () => {
      const user = User.from(admin);

      expect(() => user.updateRole('MEMBRE_SIEGE')).toThrow(CantGiveAdminAMemberRole);
      expect(user.assignableRoles()).toEqual(['FIRST_SECRETARY', 'SECRETARY', 'OFFICER']);
    });

    it('should let an admin change role within the general secretariat', () => {
      const user = User.from(admin);
      user.updateRole('SECRETARY');

      expect(user.messages).toContainEqual(expect.any(UserRoleUpdated));
    });

    it('should leave a user who is not an admin as is when demoted', () => {
      const user = User.from(baseProps);
      user.demoteAdmin({ actorId: 'admin-1', now });

      expect(user.messages).toEqual([]);
    });
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
      user.reactivate({ actorId: 'admin-1', now });

      expect(user.messages).toEqual([new UserReactivated(user.id, now, 'admin-1')]);
    });

    it('should leave an active user as is when reactivated', () => {
      const user = User.from(baseProps);
      user.reactivate({ actorId: 'admin-1', now });

      expect(user.messages).toEqual([]);
    });

    it('should refuse to reset the password of a deactivated user', () => {
      const user = User.from({ ...baseProps, status: 'DEACTIVATED' });

      expect(() => user.updatePassword('hashed')).toThrow(CantResetPasswordOfDeactivatedAccount);
      expect(user.canResetPassword()).toBe(false);
    });
  });
});
