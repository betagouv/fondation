import { makeId } from '../../../utils/id';
import { ADMIN_USER_ROLES_ENUM, AdminUserRoleEnum } from '../../shared/admin-user-role.enum';
import { GenderEnum } from '../../shared/gender.enum';
import { isSecretariat } from '../../shared/role.enum';
import { UserStatus } from '../../shared/user-status.enum';
import { UserTitleEnum } from '../../shared/user-title.enum';

import { AdminUserRole } from './admin-user-role';
import { AdminUserTitle } from './admin-user-title';
import { adminUserRoleEnumToIdentityRoles } from './user-enum';

export class UserRegistered {
  readonly email: string;
  readonly firstName: string;
  readonly gender: GenderEnum;
  readonly hashedPassword: string;
  readonly isAdmin: boolean;
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
  | UserPasswordUpdated
  | UserRoleUpdated
  | UsersUntitled
  | UserDisplayTitleUpdated
  | UserPromotedToAdmin
  | UserDemotedFromAdmin
  | UserDeactivated
  | UserReactivated;

export class CantPromoteMemberToAdmin extends Error {}
export class CantGiveAdminAMemberRole extends Error {}
export class CantDeactivateOwnAccount extends Error {}
export class EmailAlreadyTaken extends Error {}

export class User {
  readonly #messages: UserEvent[] = [];

  get messages(): readonly UserEvent[] {
    return this.#messages;
  }

  private constructor(
    readonly id: string,
    private readonly isAdmin: boolean,
    private readonly role: AdminUserRole,
    private readonly status: UserStatus,
  ) {}

  static from(props: { id: string; isAdmin: boolean; role: AdminUserRole; status: UserStatus }): User {
    return new User(props.id, props.isAdmin, props.role, props.status);
  }

  /** a new account takes its whole role at once, the title of its role taken back from its holder */
  static register(props: {
    email: string;
    firstName: string;
    gender: GenderEnum;
    hashedPassword: string;
    isAdmin: boolean;
    lastName: string;
    now: Date;
    registeredBy: string | null;
    role: AdminUserRole;
  }): User {
    const user = new User(makeId(), props.isAdmin, props.role, 'ACTIVE');
    if (props.isAdmin && !user.canHoldAdminRight()) throw new CantPromoteMemberToAdmin();

    const target = AdminUserTitle.from(props.role.toString());
    if (target.title) user.#messages.push(new UsersUntitled(user.id, target.title, target.unTitle()));

    user.#messages.push(
      new UserRegistered({
        ...props,
        email: props.email.toLowerCase(),
        firstName: props.firstName.toLowerCase(),
        lastName: props.lastName.toLowerCase(),
        registeredAt: props.now,
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

  /** the admin right belongs to the general secretariat, so an admin keeps one of its roles */
  canHoldAdminRight(): boolean {
    return isSecretariat(this.role.role);
  }

  assignableRoles(): AdminUserRoleEnum[] {
    if (!this.isAdmin) return [...ADMIN_USER_ROLES_ENUM];

    return ADMIN_USER_ROLES_ENUM.filter((role) =>
      adminUserRoleEnumToIdentityRoles(role).every(isSecretariat),
    );
  }

  updateEmail(command: { email: string; isTakenByAnotherUser: boolean }): void {
    User.assertEmailFree(command.isTakenByAnotherUser);

    this.#messages.push(new UserEmailUpdated(this.id, command.email));
  }

  updatePassword(hashedPassword: string): void {
    this.#messages.push(new UserPasswordUpdated(this.id, hashedPassword));
  }

  updateRole(nextRole: AdminUserRoleEnum): void {
    if (!this.assignableRoles().includes(nextRole)) throw new CantGiveAdminAMemberRole();

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
