import z from 'zod';

import { Id, makeId } from '../../../utils/id';
import { GenderEnum } from '../../shared/gender.enum';
import { isSecretariat, type RoleEnum } from '../../shared/role.enum';
import { UserStatus } from '../../shared/user-status.enum';
import { OpenIdProvider } from '../openid';

import { AuthImpersonation } from './auth-impersonation';
import { AuthPassword } from './auth-password';
import { AuthSession } from './auth-session';

export class AuthUserNotAuthentifiable extends Error {}
export class DeactivatedUserNotImpersonable extends Error {}
export class AdminOutsideSecretariat extends Error {}
export class WrongCurrentPassword extends Error {}

export class AuthUserRegistered {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: RoleEnum;
  readonly isAdmin: boolean;
  readonly email: string;
  readonly password: string;
  readonly gender: GenderEnum;

  constructor(props: {
    id: string;
    firstName: string;
    lastName: string;
    role: RoleEnum;
    isAdmin: boolean;
    email: string;
    password: AuthPassword;
    gender: GenderEnum;
  }) {
    this.id = props.id;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.role = props.role;
    this.isAdmin = props.isAdmin;
    this.email = props.email;
    this.password = props.password.toString();
    this.gender = props.gender;
  }
}

export class AuthUserUnAuthenticated {
  constructor(
    readonly id: string,
    readonly sessionId: string,
  ) {}
}

export class AuthUserSessionsRevoked {
  constructor(
    readonly id: string,
    readonly keptSessionId: string | undefined,
  ) {}
}

export class AuthUserAuthenticated {
  constructor(
    readonly id: string,
    readonly session: {
      id: string;
      startedAt: Date;
      durationMs: number;
      data: { userId: string };
    },
  ) {}
}

export class AuthUserPasswordRehashed {
  constructor(
    readonly id: string,
    readonly password: string,
  ) {}
}

export class AuthUserPasswordChanged {
  constructor(
    readonly id: string,
    readonly password: string,
  ) {}
}

export class AuthImpersonationStarted {
  constructor(
    readonly id: string,
    readonly impersonation: AuthImpersonation,
  ) {}
}

export class AuthImpersonationRevoked {
  constructor(
    readonly id: string,
    readonly impersonationId: string,
  ) {}
}

export class AuthOpenIdRequestCompleted {
  constructor(
    readonly userId: string,
    readonly request: { id: Id<'OpenIdRequest'>; provider: OpenIdProvider },
  ) {}
}

export type AuthenticationStrategy =
  | { type: 'password'; plainPassword: string }
  | { type: 'openid'; request: { id: Id<'OpenIdRequest'>; provider: OpenIdProvider } };

type AuthUserEvent =
  | AuthUserRegistered
  | AuthUserAuthenticated
  | AuthUserUnAuthenticated
  | AuthUserSessionsRevoked
  | AuthUserPasswordRehashed
  | AuthUserPasswordChanged
  | AuthImpersonationStarted
  | AuthImpersonationRevoked
  | AuthOpenIdRequestCompleted;

export class AuthUser {
  constructor(
    readonly id: string,
    readonly password: AuthPassword,
    readonly status: UserStatus,
  ) {}

  async authenticate(props: AuthenticationStrategy & { now: Date }): Promise<AuthSession> {
    if (props.type === 'password') {
      if (!(await this.password.equals(props.plainPassword))) {
        throw new AuthUserNotAuthentifiable();
      }
    }

    // Refused after the password check, with the same error, so that nothing reveals that the account exists
    if (this.status === 'DEACTIVATED') throw new AuthUserNotAuthentifiable();

    const session = AuthSession.start({
      data: { userId: this.id },
      now: props.now,
    });

    this.#messages.push(new AuthUserAuthenticated(this.id, session));
    if (props.type === 'openid') {
      this.#messages.push(new AuthOpenIdRequestCompleted(this.id, props.request));
    }

    return session;
  }

  rehashPassword(password: AuthPassword): void {
    this.#messages.push(new AuthUserPasswordRehashed(this.id, password.toString()));
  }

  async changePassword(command: {
    currentPassword: string;
    keptSessionId: string;
    password: AuthPassword;
  }): Promise<void> {
    if (!(await this.password.equals(command.currentPassword))) throw new WrongCurrentPassword();

    this.#messages.push(new AuthUserPasswordChanged(this.id, command.password.toString()));
    this.revokeSessions(command);
  }

  unAuthenticate(sessionId: string): void {
    this.#messages.push(new AuthUserUnAuthenticated(this.id, sessionId));
  }

  revokeSessions(command: { keptSessionId: string | undefined }): void {
    this.#messages.push(new AuthUserSessionsRevoked(this.id, command.keptSessionId));
  }

  static from(props: { id: string; password: string; status: UserStatus }): AuthUser {
    return new AuthUser(props.id, AuthPassword.from(props.password), props.status);
  }

  static async register(props: {
    firstName: string;
    lastName: string;
    role: RoleEnum;
    isAdmin: boolean;
    email: string;
    password: AuthPassword;
    gender: GenderEnum;
  }) {
    if (props.isAdmin && !isSecretariat(props.role)) throw new AdminOutsideSecretariat();
    const email = await z.email().toLowerCase().parseAsync(props.email);
    const id = makeId('AuthUserId');

    const user = new AuthUser(id, props.password, 'ACTIVE');
    user.#messages.push(
      new AuthUserRegistered({
        ...props,
        email,
        firstName: props.firstName.toLowerCase(),
        id,
        lastName: props.lastName.toLowerCase(),
      }),
    );
    return user;
  }

  static canBeImpersonated(user: { status: UserStatus }): boolean {
    return user.status === 'ACTIVE';
  }

  impersonate(props: { authSessionId: string; now: Date; target: AuthUser }): AuthImpersonation {
    if (!AuthUser.canBeImpersonated(props.target)) throw new DeactivatedUserNotImpersonable();

    const impersonation = AuthImpersonation.start({
      authSessionId: props.authSessionId,
      impersonateId: props.target.id,
      now: props.now,
    });

    this.#messages.push(new AuthImpersonationStarted(this.id, impersonation));

    return impersonation;
  }

  unImpersonate(props: { impersonationId: string }): void {
    this.#messages.push(new AuthImpersonationRevoked(this.id, props.impersonationId));
  }

  readonly #messages: AuthUserEvent[] = [];
  get messages(): AuthUserEvent[] {
    return this.#messages;
  }
}
