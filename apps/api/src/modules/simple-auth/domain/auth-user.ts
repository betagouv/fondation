import { Gender, Role } from 'shared-models';
import z from 'zod';

import { makeId } from 'src/utils/id';

import { AuthSession } from './auth-session';
import { AuthPassword } from './auth-password';

export class AuthUserNotAuthentifiable extends Error {}

export class AuthUserRegistered {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: Role;
  readonly email: string;
  readonly password: string;
  readonly gender: Gender;

  constructor(props: {
    id: string;
    firstName: string;
    lastName: string;
    role: Role;
    email: string;
    password: AuthPassword;
    gender: Gender;
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

type AuthUserEvent =
  | AuthUserRegistered
  | AuthUserAuthenticated
  | AuthUserUnAuthenticated;

export class AuthUser {
  constructor(
    readonly id: string,
    readonly password: AuthPassword,
  ) {}

  authenticate(props: { plainPassword: string; now: Date }): AuthSession {
    if (!this.password.equals(props.plainPassword)) {
      throw new AuthUserNotAuthentifiable();
    }

    const session = AuthSession.start({
      data: { userId: this.id },
      now: props.now,
    });

    this.#messages.push(new AuthUserAuthenticated(this.id, session));
    return session;
  }

  unAuthenticate(sessionId: string): void {
    this.#messages.push(new AuthUserUnAuthenticated(this.id, sessionId));
  }

  static from(props: { id: string; password: string }): AuthUser {
    return new AuthUser(props.id, AuthPassword.from(props.password));
  }

  static async register(props: {
    firstName: string;
    lastName: string;
    role: Role;
    email: string;
    password: string;
    gender: Gender;
  }) {
    const password = await AuthPassword.create(props.password);
    const email = await z.email().parseAsync(props.email);
    const id = makeId('AuthUserId');

    const user = new AuthUser(id, password);
    user.#messages.push(
      new AuthUserRegistered({ ...props, email, id, password }),
    );
    return user;
  }

  readonly #messages: AuthUserEvent[] = [];
  get messages(): AuthUserEvent[] {
    return this.#messages;
  }
}
