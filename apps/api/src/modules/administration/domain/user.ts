import { Role } from 'shared-models';
import { PrismaUserDutyEnum, PrismaUserTitleEnum } from 'src/generated/prisma/enums';
import { AuthPassword } from 'src/modules/simple-auth/domain/auth-password';

export const USER_TITLES = ['PRESIDENT_SIEGE', 'PRESIDENT_PARQUET', 'FIRST_SECRETARY'] as const;
export type UserTitle = (typeof USER_TITLES)[number];

export const USER_DUTIES = ['PRESIDENT', 'SECRETARY', 'OFFICER'] as const;
export type UserDuty = (typeof USER_DUTIES)[number];

export function toUserTitle(value: PrismaUserTitleEnum | null): UserTitle | null {
  return USER_TITLES.includes(value as UserTitle) ? (value as UserTitle) : null;
}

export function toUserDuty(value: PrismaUserDutyEnum | null): UserDuty | null {
  return USER_DUTIES.includes(value as UserDuty) ? (value as UserDuty) : null;
}

export class IncompatibleTitle extends Error {
  private static readonly messages: Record<UserTitle, string> = {
    PRESIDENT_SIEGE: "La distinction Président du Siège ne peut être attribué qu'à un membre commun ou du Siège",
    PRESIDENT_PARQUET: "La distinction Président du Parquet ne peut être attribué qu'à un membre commun ou du Parquet",
    FIRST_SECRETARY: 'La distinction Secrétaire Général ne peut pas être attribuée à un membre.',
  };

  constructor(title: UserTitle) {
    super(IncompatibleTitle.messages[title]);
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
    readonly duty: UserDuty | null,
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

  private constructor(
    readonly id: string,
    readonly email: string,
    readonly role: Role,
    readonly title: UserTitle | null,
    readonly duty: UserDuty | null,
    readonly displayTitle: string | null,
  ) {}

  get messages(): readonly UserEvent[] {
    return this.#messages;
  }

  static from(props: {
    id: string;
    email: string;
    role: Role;
    title: UserTitle | null;
    duty: UserDuty | null;
    displayTitle: string | null;
  }): User {
    return new User(props.id, props.email, props.role, props.title, props.duty, props.displayTitle);
  }

  updateEmail(email: string): void {
    this.#messages.push(new UserEmailUpdated(this.id, email));
  }

  async updatePassword(plainPassword: string): Promise<void> {
    const hashed = await AuthPassword.create(plainPassword);
    this.#messages.push(new UserPasswordUpdated(this.id, hashed.toString()));
  }

  updateRole(role: Role): void {
    this.#messages.push(new UserRoleUpdated(this.id, role));
  }

  updateDuty(duty: UserDuty | null): void {
    this.#messages.push(new UserDutyUpdated(this.id, duty));
  }

  updateDisplayTitle(displayTitle: string | null): void {
    this.#messages.push(new UserDisplayTitleUpdated(this.id, displayTitle));
  }

  updateTitle(title: UserTitle | null): void {
    if (title === 'PRESIDENT_SIEGE' && this.role === Role.MEMBRE_DU_PARQUET) {
      throw new IncompatibleTitle('PRESIDENT_SIEGE');
    }
    if (title === 'PRESIDENT_PARQUET' && this.role === Role.MEMBRE_DU_SIEGE) {
      throw new IncompatibleTitle('PRESIDENT_PARQUET');
    }
    if (title === 'FIRST_SECRETARY' && this.role !== Role.ADJOINT_SECRETAIRE_GENERAL && this.role !== Role.ADMIN) {
      throw new IncompatibleTitle('FIRST_SECRETARY');
    }

    if (title === 'PRESIDENT_SIEGE' || title === 'PRESIDENT_PARQUET') {
      this.#messages.push(new UserTitleUpdated(this.id, title, 'PRESIDENT'));
    } else if (title === 'FIRST_SECRETARY') {
      this.#messages.push(new UserTitleUpdated(this.id, title, 'SECRETARY'));
    } else {
      this.#messages.push(new UserTitleUpdated(this.id, null, null));
    }
  }
}
