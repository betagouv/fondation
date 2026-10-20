import z from 'zod';

import { OpenIdProvider } from '../openid';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { UserStatus } from 'src/modules/shared/user-status.enum';
import { Id, makeId } from 'src/utils/id';

import { AuthImpersonation } from './auth-impersonation';
import { AuthPassword } from './auth-password';
import { AuthSession } from './auth-session';

export class AuthUserNotAuthentifiable extends Error {}
export class DeactivatedUserNotImpersonable extends Error {}

export class AuthUserRegistered {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: RoleEnum;
  readonly email: string;
  readonly password: string;
  readonly gender: GenderEnum;

  constructor(props: {
    id: string;
    firstName: string;
    lastName: string;
    role: RoleEnum;
    email: string;
    password: AuthPassword;
    gender: GenderEnum;
  }) {
    this.id = props.id;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.role = props.role;
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
  | AuthImpersonationStarted
  | AuthImpersonationRevoked
  | AuthOpenIdRequestCompleted;

export class AuthUser {
  constructor(
    readonly id: string,
    private readonly password: AuthPassword,
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
    email: string;
    password: string;
    gender: GenderEnum;
  }) {
    const password = await AuthPassword.create(props.password);
    const email = await z.email().toLowerCase().parseAsync(props.email);
    const id = makeId('AuthUserId');

    const user = new AuthUser(id, password, 'ACTIVE');
    user.#messages.push(
      new AuthUserRegistered({
        ...props,
        id,
        email,
        password,
        firstName: props.firstName.toLowerCase(),
        lastName: props.lastName.toLowerCase(),
      }),
    );
    return user;
  }

  impersonate(props: { authSessionId: string; target: AuthUser; now: Date }): AuthImpersonation {
    if (props.target.status === 'DEACTIVATED') throw new DeactivatedUserNotImpersonable();

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
