import { Role } from './roles';
import { UserRegisteredEvent } from './user-registered.event';

export type UserSnapshot = {
  id: string;
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
};

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly password: string,
    public readonly role: Role,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {}

  toSnapshot(): UserSnapshot {
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      role: this.role,
      firstName: this.firstName,
      lastName: this.lastName,
    };
  }

  static fromSnapshot(snapshot: UserSnapshot): User {
    return new User(
      snapshot.id,
      snapshot.email,
      snapshot.password,
      snapshot.role,
      snapshot.firstName,
      snapshot.lastName,
    );
  }

  static register(
    currentDate: Date,
    generateUuid: () => string,
    email: string,
    password: string,
    role: Role,
    firstName: string,
    lastName: string,
  ): [User, UserRegisteredEvent] {
    const user = new User(
      generateUuid(),
      email,
      password,
      role,
      firstName,
      lastName,
    );
    const event = new UserRegisteredEvent(
      generateUuid(),
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      currentDate,
    );
    return [user, event];
  }
}
