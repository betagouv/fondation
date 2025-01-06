import { z } from 'zod';
import { Role } from './role';
import { UserRegisteredEvent } from './user-registered.event';
import { DomainRegistry } from './domain-registry';

export type UserSnapshot = {
  id: string;
  createdAt: Date;
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
};

export class User {
  private _id: string;
  private _createdAt: Date;
  private _email: string;
  private _password: string;
  private _role: Role;
  private _firstName: string;
  private _lastName: string;

  constructor(
    id: string,
    createdAt: Date,
    email: string,
    password: string,
    role: Role,
    firstName: string,
    lastName: string,
  ) {
    this.id = id;
    this.createdAt = createdAt;
    this.email = email;
    this.password = password;
    this.role = role;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  public get id(): string {
    return this._id;
  }
  private set id(value: string) {
    this._id = value;
  }

  private get createdAt(): Date {
    return this._createdAt;
  }
  private set createdAt(value: Date) {
    this._createdAt = z.date().parse(value);
  }

  private get email(): string {
    return this._email;
  }
  private set email(value: string) {
    this._email = z.string().email().parse(value);
  }

  private get password(): string {
    return this._password;
  }
  private set password(value: string) {
    this._password = z.string().min(1).parse(value);
  }

  private get role(): Role {
    return this._role;
  }
  private set role(value: Role) {
    this._role = z.nativeEnum(Role).parse(value);
  }

  private get firstName(): string {
    return this._firstName;
  }
  private set firstName(value: string) {
    this._firstName = z.string().min(1).parse(value);
  }

  private get lastName(): string {
    return this._lastName;
  }
  private set lastName(value: string) {
    this._lastName = z.string().min(1).parse(value);
  }

  toSnapshot(): UserSnapshot {
    return {
      id: this.id,
      createdAt: this.createdAt,
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
      snapshot.createdAt,
      snapshot.email,
      snapshot.password,
      snapshot.role,
      snapshot.firstName,
      snapshot.lastName,
    );
  }

  static async register(
    email: string,
    password: string,
    role: Role,
    firstName: string,
    lastName: string,
  ): Promise<[User, UserRegisteredEvent]> {
    const uuidGenerator = DomainRegistry.uuidGenerator();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    const encryptedPassword = await this.asEncryptedValue(password);

    const user = new User(
      uuidGenerator.generate(),
      currentDate,
      email,
      encryptedPassword,
      role,
      firstName,
      lastName,
    );

    const event = new UserRegisteredEvent(
      uuidGenerator.generate(),
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

  private static async asEncryptedValue(password: string): Promise<string> {
    return await DomainRegistry.encryptionProvider().encryptedValue(password);
  }
}
