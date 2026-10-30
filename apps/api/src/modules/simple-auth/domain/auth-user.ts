import { Id } from '../../../utils/id';
import { isSecretariat, RoleEnum } from '../../shared/role.enum';
import { UserStatus } from '../../shared/user-status.enum';
import { OpenIdProvider } from '../openid';

import { AuthImpersonation } from './auth-impersonation';
import { AuthPassword } from './auth-password';
import { AuthSession } from './auth-session';

export class AuthUserNotAuthentifiable extends Error {}
export class UserNotImpersonable extends Error {}
export class WrongCurrentPassword extends Error {}

export const PASSWORD_CHANGES = ['ALLOWED', 'IMPERSONATED'] as const;
export type PasswordChange = (typeof PASSWORD_CHANGES)[number];

export class CannotChangePassword extends Error {
  constructor(readonly reason: Exclude<PasswordChange, 'ALLOWED'>) {
    super();
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
      data: { userId: string };
      durationMs: number;
      id: string;
      startedAt: Date;
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
  | { plainPassword: string; type: 'password' }
  | { request: { id: Id<'OpenIdRequest'>; provider: OpenIdProvider }; type: 'openid' };

type AuthUserEvent =
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
    readonly role: RoleEnum,
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

  static passwordChangeOf(session: { isImpersonated: boolean }): PasswordChange {
    return session.isImpersonated ? 'IMPERSONATED' : 'ALLOWED';
  }

  async changePassword(command: {
    currentPassword: string;
    hash: (plain: string) => Promise<AuthPassword>;
    isImpersonated: boolean;
    keptSessionId: string;
    newPassword: string;
  }): Promise<void> {
    const passwordChange = AuthUser.passwordChangeOf(command);
    if (passwordChange !== 'ALLOWED') throw new CannotChangePassword(passwordChange);
    if (!(await this.password.equals(command.currentPassword))) throw new WrongCurrentPassword();

    const password = await command.hash(command.newPassword);
    this.#messages.push(new AuthUserPasswordChanged(this.id, password.toString()));
    this.revokeSessions(command);
  }

  unAuthenticate(sessionId: string): void {
    this.#messages.push(new AuthUserUnAuthenticated(this.id, sessionId));
  }

  revokeSessions(command: { keptSessionId: string | undefined }): void {
    this.#messages.push(new AuthUserSessionsRevoked(this.id, command.keptSessionId));
  }

  static from(props: { id: string; password: string; role: RoleEnum; status: UserStatus }): AuthUser {
    return new AuthUser(props.id, AuthPassword.from(props.password), props.role, props.status);
  }

  /** an admin acts in place of a member, never of someone from the secretariat, whose screens are their own */
  static canBeImpersonated(user: { role: RoleEnum; status: UserStatus }): boolean {
    return user.status === 'ACTIVE' && !isSecretariat(user.role);
  }

  impersonate(props: { authSessionId: string; now: Date; target: AuthUser }): AuthImpersonation {
    if (!AuthUser.canBeImpersonated(props.target)) throw new UserNotImpersonable();

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
