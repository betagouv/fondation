import { BadRequestException } from '@nestjs/common';

import { Role } from 'shared-models';

import { AuthPassword } from 'src/modules/simple-auth/domain/auth-password';
import { assertNever } from 'src/utils/assert-never';
import { isDefined } from 'src/utils/is-defined';
import { UserDuty, UserTitle } from './user-enum';

export class IncompatibleTitle extends BadRequestException {
  private static readonly messages: Record<UserTitle, string> = {
    PRESIDENT_SIEGE:
      "La distinction Président du Siège ne peut être attribué qu'à un membre commun ou du Siège",
    PRESIDENT_PARQUET:
      "La distinction Président du Parquet ne peut être attribué qu'à un membre commun ou du Parquet",
    FIRST_SECRETARY:
      'La distinction Secrétaire Général ne peut pas être attribuée à un membre.',
  };

  constructor(title: UserTitle) {
    super(IncompatibleTitle.messages[title]);
  }
}

export class IncompatibleDuty extends BadRequestException {
  private static readonly messages: Record<UserDuty, string> = {
    OFFICER: `La fonction d'agent ne peut pas être attribuée à un membre`,
    SECRETARY: `La fonction de secrétaire ne peut être attribuée à un membre`,
    PRESIDENT: `La fonction de président ne peut être attribuée à un non-membre`,
  };

  constructor(title: UserDuty) {
    super(IncompatibleDuty.messages[title]);
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
    readonly role: Role,
  ) {}
}

export class UserDutyUpdated {
  constructor(
    readonly userId: string,
    readonly duty: UserDuty | null,
  ) {}
}

export class UserDisplayTitleUpdated {
  constructor(
    readonly userId: string,
    readonly displayTitle: string | null,
  ) {}
}

export class UserTitleUpdated {
  constructor(
    readonly userId: string,
    readonly title: UserTitle | null,
  ) {}
}

export type UserEvent =
  | UserEmailUpdated
  | UserPasswordUpdated
  | UserRoleUpdated
  | UserDutyUpdated
  | UserDisplayTitleUpdated
  | UserTitleUpdated;

export class User {
  readonly #messages: UserEvent[] = [];

  get role(): Role {
    return this._role;
  }

  private constructor(
    readonly id: string,
    private _role: Role,
    private title: UserTitle | null,
    private duty: UserDuty | null,
  ) {}

  get messages(): readonly UserEvent[] {
    return this.#messages;
  }

  static from(props: {
    id: string;
    role: Role;
    title: UserTitle | null;
    duty: UserDuty | null;
  }): User {
    return new User(props.id, props.role, props.title, props.duty);
  }

  updateEmail(email: string): void {
    this.#messages.push(new UserEmailUpdated(this.id, email));
  }

  async updatePassword(plainPassword: string): Promise<void> {
    const hashed = await AuthPassword.create(plainPassword);
    this.#messages.push(new UserPasswordUpdated(this.id, hashed.toString()));
  }

  updateRole(role: Role): void {
    if (!User.roleAndTitleAreCompatible({ role, title: this.title })) {
      this.updateTitle(null);
    }

    if (!User.roleAndDutyAreCompatible({ role, duty: this.duty })) {
      this.updateDuty(null);
    }

    this._role = role;
    this.#messages.push(new UserRoleUpdated(this.id, role));
  }

  updateDuty(duty: UserDuty | null): void {
    if (
      isDefined(duty) &&
      !User.roleAndDutyAreCompatible({ duty, role: this.role })
    ) {
      throw new IncompatibleDuty(duty);
    }

    this.duty = duty;
    this.#messages.push(new UserDutyUpdated(this.id, duty));
  }

  updateDisplayTitle(displayTitle: string | null): void {
    this.#messages.push(new UserDisplayTitleUpdated(this.id, displayTitle));
  }

  updateTitle(title: UserTitle | null): void {
    if (
      isDefined(title) &&
      !User.roleAndTitleAreCompatible({ title, role: this.role })
    ) {
      throw new IncompatibleTitle(title);
    }

    const duty = ((): UserDuty | null | undefined => {
      switch (title) {
        case 'PRESIDENT_PARQUET':
        case 'PRESIDENT_SIEGE':
          return 'PRESIDENT';
        case 'FIRST_SECRETARY':
          return 'SECRETARY';
        case null: {
          switch (this.title) {
            case 'PRESIDENT_PARQUET':
            case 'PRESIDENT_SIEGE':
              return null;

            case null:
            case 'FIRST_SECRETARY':
              return undefined;
            default:
              return assertNever(this.title);
          }
        }
        default:
          return assertNever(title);
      }
    })();

    this.title = title;
    this.#messages.push(new UserTitleUpdated(this.id, title));

    if (duty !== undefined) {
      this.updateDuty(duty);
    }
  }

  private static roleAndDutyAreCompatible(input: {
    role: Role;
    duty: UserDuty | null;
  }): boolean {
    if (!isDefined(input.duty)) return true;
    return this.DUTY_ROLES[input.duty].has(input.role);
  }

  private static roleAndTitleAreCompatible(input: {
    role: Role;
    title: UserTitle | null;
  }): boolean {
    if (!isDefined(input.title)) return true;
    return this.TITLE_ROLES[input.title].has(input.role);
  }

  // prettier-ignore
  private static readonly DUTY_ROLES: Record<UserDuty, Set<Role>> = {
    OFFICER: new Set([Role.ADMIN, Role.ADJOINT_SECRETAIRE_GENERAL]),
    SECRETARY: new Set([Role.ADMIN, Role.ADJOINT_SECRETAIRE_GENERAL]),
    PRESIDENT: new Set([Role.MEMBRE_COMMUN, Role.MEMBRE_DU_PARQUET, Role.MEMBRE_DU_SIEGE]),
  };

  // prettier-ignore
  private static readonly TITLE_ROLES: Record<UserTitle, Set<Role>> = {
    PRESIDENT_PARQUET: new Set([Role.MEMBRE_COMMUN, Role.MEMBRE_DU_PARQUET]),
    PRESIDENT_SIEGE: new Set([Role.MEMBRE_COMMUN, Role.MEMBRE_DU_SIEGE]),
    FIRST_SECRETARY: new Set([Role.ADMIN, Role.ADJOINT_SECRETAIRE_GENERAL]),
  };
}
