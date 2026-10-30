import { makeId } from '../../../utils/id';
import { ADMIN_USER_ROLES_ENUM, AdminUserRoleEnum } from '../../shared/admin-user-role.enum';
import { GenderEnum } from '../../shared/gender.enum';
import { isSecretariat } from '../../shared/role.enum';
import { UserStatus } from '../../shared/user-status.enum';
import { UserTitleEnum } from '../../shared/user-title.enum';

import { AdminUserRole } from './admin-user-role';
import { AdminUserTitle } from './admin-user-title';
import { adminUserRoleEnumToIdentityRoles, adminUserRoleEnumToTitle } from './user-enum';

export class UserRegistered {
  readonly email: string;
  readonly firstName: string;
  readonly gender: GenderEnum;
  readonly hashedPassword: string;
  readonly isAdmin: boolean;
  readonly isTechnical: boolean;
  readonly lastName: string;
  readonly registeredAt: Date;
  readonly registeredBy: string | null;
  readonly role: AdminUserRole;
  readonly userId: string;

  constructor(props: {
    email: string;
    firstName: string;
    gender: GenderEnum;
    hashedPassword: string;
    isAdmin: boolean;
    isTechnical: boolean;
    lastName: string;
    registeredAt: Date;
    registeredBy: string | null;
    role: AdminUserRole;
    userId: string;
  }) {
    this.email = props.email;
    this.firstName = props.firstName;
    this.gender = props.gender;
    this.hashedPassword = props.hashedPassword;
    this.isAdmin = props.isAdmin;
    this.isTechnical = props.isTechnical;
    this.lastName = props.lastName;
    this.registeredAt = props.registeredAt;
    this.registeredBy = props.registeredBy;
    this.role = props.role;
    this.userId = props.userId;
  }
}

export class UserEmailUpdated {
  constructor(
    readonly userId: string,
    readonly email: string,
  ) {}
}

export class UserNameUpdated {
  constructor(
    readonly userId: string,
    readonly firstName: string | undefined,
    readonly lastName: string | undefined,
  ) {}
}

export class UserPasswordUpdated {
  constructor(
    readonly userId: string,
    readonly hashedPassword: string,
  ) {}
}

export class UserRoleUpdated {
  constructor(
    readonly userId: string,
    readonly role: AdminUserRole,
  ) {}
}

export class UserDisplayTitleUpdated {
  constructor(
    readonly userId: string,
    readonly displayTitle: string | null,
  ) {}
}

export class UsersUntitled {
  constructor(
    readonly userId: string,
    readonly sourceTitle: UserTitleEnum,
    readonly targetRole: AdminUserTitle,
  ) {}
}

export class UserPromotedToAdmin {
  constructor(
    readonly userId: string,
    readonly promotedAt: Date,
    readonly promotedBy: string,
  ) {}
}

export class UserDemotedFromAdmin {
  constructor(
    readonly userId: string,
    readonly demotedAt: Date,
    readonly demotedBy: string,
  ) {}
}

export class UserTechnicalAccountUpdated {
  constructor(
    readonly userId: string,
    readonly isTechnical: boolean,
    readonly changedAt: Date,
    readonly changedBy: string,
  ) {}
}

export class UserDeactivated {
  constructor(
    readonly userId: string,
    readonly deactivatedAt: Date,
    readonly deactivatedBy: string,
  ) {}
}

export class UserReactivated {
  constructor(
    readonly userId: string,
    readonly reactivatedAt: Date,
    readonly reactivatedBy: string,
  ) {}
}

export type UserEvent =
  | UserRegistered
  | UserEmailUpdated
  | UserNameUpdated
  | UserPasswordUpdated
  | UserRoleUpdated
  | UsersUntitled
  | UserDisplayTitleUpdated
  | UserPromotedToAdmin
  | UserDemotedFromAdmin
  | UserTechnicalAccountUpdated
  | UserDeactivated
  | UserReactivated;

export class CantPromoteMemberToAdmin extends Error {}
export class CantGiveAdminAMemberRole extends Error {}
export class CantGiveTechnicalAccountThisRole extends Error {}
export class CantManageTechnicalAccounts extends Error {}
export class CantDeactivateOwnAccount extends Error {}
export class CantResetPasswordOfDeactivatedAccount extends Error {}
export class EmailAlreadyTaken extends Error {}

/** a title belongs to one person of the CSM, which a technical account would take from them */
function suitsTechnicalAccount(role: AdminUserRoleEnum): boolean {
  return (
    adminUserRoleEnumToIdentityRoles(role).every(isSecretariat) && adminUserRoleEnumToTitle(role) === null
  );
}

export class User {
  readonly #messages: UserEvent[] = [];

  get messages(): readonly UserEvent[] {
    return this.#messages;
  }

  private constructor(
    readonly id: string,
    private readonly isAdmin: boolean,
    private readonly isTechnical: boolean,
    private readonly role: AdminUserRole,
    private readonly status: UserStatus,
  ) {}

  static from(props: {
    id: string;
    isAdmin: boolean;
    isTechnical: boolean;
    role: AdminUserRole;
    status: UserStatus;
  }): User {
    return new User(props.id, props.isAdmin, props.isTechnical, props.role, props.status);
  }

  /** a new account takes its whole role at once, the title of its role taken back from its holder */
  static register(props: {
    email: string;
    firstName: string;
    gender: GenderEnum;
    hashedPassword: string;
    isAdmin: boolean;
    isTechnical: boolean;
    lastName: string;
    now: Date;
    /** none from the CLI, run on the server by the developers, which registers the first technical account */
    registrar: User | null;
    role: AdminUserRole;
  }): User {
    const user = new User(makeId(), props.isAdmin, props.isTechnical, props.role, 'ACTIVE');
    if (props.isAdmin && !user.canHoldAdminRight()) throw new CantPromoteMemberToAdmin();
    if (props.isTechnical && !suitsTechnicalAccount(props.role.toString())) {
      throw new CantGiveTechnicalAccountThisRole();
    }
    if (props.isTechnical && props.registrar && !props.registrar.canManageTechnicalAccounts()) {
      throw new CantManageTechnicalAccounts();
    }

    const target = AdminUserTitle.from(props.role.toString());
    if (target.title) user.#messages.push(new UsersUntitled(user.id, target.title, target.unTitle()));

    user.#messages.push(
      new UserRegistered({
        ...props,
        email: props.email.toLowerCase(),
        firstName: props.firstName.toLowerCase(),
        lastName: props.lastName.toLowerCase(),
        registeredAt: props.now,
        registeredBy: props.registrar?.id ?? null,
        userId: user.id,
      }),
      new UserRoleUpdated(user.id, props.role),
    );
    return user;
  }

  /** the login matches an email whatever its case, so an email opens one account only */
  static assertEmailFree(isTaken: boolean): void {
    if (isTaken) throw new EmailAlreadyTaken();
  }

  canDeactivate(actorId: string): boolean {
    return this.status === 'ACTIVE' && actorId !== this.id;
  }

  canReactivate(): boolean {
    return this.status === 'DEACTIVATED';
  }

  canResetPassword(): boolean {
    return this.status === 'ACTIVE';
  }

  /** the admin right belongs to the general secretariat, so an admin keeps one of its roles */
  canHoldAdminRight(): boolean {
    return isSecretariat(this.role.role);
  }

  /** only a developer marks the accounts of the developers, for no agent of the CSM to drop out of its lists by mistake */
  static canManageTechnicalAccounts(actor: { isTechnical: boolean }): boolean {
    return actor.isTechnical;
  }

  canManageTechnicalAccounts(): boolean {
    return User.canManageTechnicalAccounts({ isTechnical: this.isTechnical });
  }

  technicalAccountManageableBy(actor: { isTechnical: boolean }): boolean {
    return (
      User.canManageTechnicalAccounts(actor) &&
      (this.isTechnical || suitsTechnicalAccount(this.role.toString()))
    );
  }

  /** a technical account, kept out of the lists of the CSM, holds a secretariat role for its rights only */
  assignableRoles(): AdminUserRoleEnum[] {
    if (this.isTechnical) return ADMIN_USER_ROLES_ENUM.filter(suitsTechnicalAccount);
    if (!this.isAdmin) return [...ADMIN_USER_ROLES_ENUM];

    return ADMIN_USER_ROLES_ENUM.filter((role) =>
      adminUserRoleEnumToIdentityRoles(role).every(isSecretariat),
    );
  }

  updateEmail(command: { email: string; isTakenByAnotherUser: boolean }): void {
    User.assertEmailFree(command.isTakenByAnotherUser);

    this.#messages.push(new UserEmailUpdated(this.id, command.email));
  }

  updateName(command: { firstName?: string; lastName?: string }): void {
    this.#messages.push(new UserNameUpdated(this.id, command.firstName, command.lastName));
  }

  updatePassword(hashedPassword: string): void {
    if (!this.canResetPassword()) throw new CantResetPasswordOfDeactivatedAccount();

    this.#messages.push(new UserPasswordUpdated(this.id, hashedPassword));
  }

  updateRole(nextRole: AdminUserRoleEnum): void {
    if (!this.assignableRoles().includes(nextRole)) {
      throw this.isTechnical ? new CantGiveTechnicalAccountThisRole() : new CantGiveAdminAMemberRole();
    }

    const target = AdminUserTitle.from(nextRole);

    const roleUpdateRequireOtherUsersUnTitling = target.title !== null && target.title !== this.role.title;

    if (roleUpdateRequireOtherUsersUnTitling) {
      this.#messages.push(new UsersUntitled(this.id, target.title, target.unTitle()));
    }

    const targetRole = this.role.reTitle(target);
    if (targetRole) {
      this.#messages.push(new UserRoleUpdated(this.id, targetRole));
    }
  }

  updateDisplayTitle(displayTitle: string | null): void {
    this.#messages.push(new UserDisplayTitleUpdated(this.id, displayTitle));
  }

  promoteAdmin(command: { actorId: string; now: Date }): void {
    if (this.isAdmin) return;
    if (!this.canHoldAdminRight()) throw new CantPromoteMemberToAdmin();

    this.#messages.push(new UserPromotedToAdmin(this.id, command.now, command.actorId));
  }

  demoteAdmin(command: { actorId: string; now: Date }): void {
    if (!this.isAdmin) return;

    this.#messages.push(new UserDemotedFromAdmin(this.id, command.now, command.actorId));
  }

  updateTechnicalAccount(command: { actor: User; isTechnical: boolean; now: Date }): void {
    if (!command.actor.canManageTechnicalAccounts()) throw new CantManageTechnicalAccounts();
    if (command.isTechnical === this.isTechnical) return;
    if (command.isTechnical && !suitsTechnicalAccount(this.role.toString())) {
      throw new CantGiveTechnicalAccountThisRole();
    }

    this.#messages.push(
      new UserTechnicalAccountUpdated(this.id, command.isTechnical, command.now, command.actor.id),
    );
  }

  deactivate(command: { actorId: string; now: Date }): void {
    if (command.actorId === this.id) throw new CantDeactivateOwnAccount();
    if (!this.canDeactivate(command.actorId)) return;

    this.#messages.push(new UserDeactivated(this.id, command.now, command.actorId));
  }

  reactivate(command: { actorId: string; now: Date }): void {
    if (!this.canReactivate()) return;

    this.#messages.push(new UserReactivated(this.id, command.now, command.actorId));
  }
}
