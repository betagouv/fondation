import { Role } from 'shared-models';

import { AuthPassword } from 'src/modules/simple-auth/domain/auth-password';

import { AdminUserRole } from './admin-user-role';
import { AdminUserTitle } from './admin-user-title';
import { AdminUserRoleEnum, UserTitleEnum } from './user-enum';

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
  constructor(readonly userId: string) {}
}

export class UserDemotedFromAdmin {
  constructor(readonly userId: string) {}
}

export type UserEvent =
  | UserEmailUpdated
  | UserPasswordUpdated
  | UserRoleUpdated
  | UsersUntitled
  | UserDisplayTitleUpdated
  | UserPromotedToAdmin
  | UserDemotedFromAdmin;

export class CantPromoteMemberToAdmin extends Error {}
export class CantDemoteFromAdmin extends Error {}

export class User {
  readonly #messages: UserEvent[] = [];

  get messages(): readonly UserEvent[] {
    return this.#messages;
  }

  private constructor(
    readonly id: string,
    private readonly role: AdminUserRole,
  ) {}

  static from(props: { id: string; role: AdminUserRole }): User {
    return new User(props.id, props.role);
  }

  updateEmail(email: string): void {
    this.#messages.push(new UserEmailUpdated(this.id, email));
  }

  async updatePassword(plainPassword: string): Promise<void> {
    const hashed = await AuthPassword.create(plainPassword);
    this.#messages.push(new UserPasswordUpdated(this.id, hashed.toString()));
  }

  updateRole(nextRole: AdminUserRoleEnum): void {
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

  promoteAdmin(): void {
    if (this.role.role === Role.ADMIN) return;

    if (this.role.role !== Role.ADJOINT_SECRETAIRE_GENERAL) {
      throw new CantPromoteMemberToAdmin();
    }

    this.#messages.push(new UserPromotedToAdmin(this.id));
  }

  demoteAdmin(): void {
    if (this.role.role !== Role.ADMIN) throw new CantDemoteFromAdmin();

    this.#messages.push(new UserDemotedFromAdmin(this.id));
  }
}
