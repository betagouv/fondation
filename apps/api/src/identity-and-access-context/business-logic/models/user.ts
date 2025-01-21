import { z } from 'zod';
import { DomainRegistry } from './domain-registry';
import { Role } from './role';
import { FullName } from './full-name';

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
  private _fullName: FullName;

  constructor(
    id: string,
    createdAt: Date,
    email: string,
    password: string,
    role: Role,
    fullName: FullName,
  ) {
    this.id = id;
    this.createdAt = createdAt;
    this.email = email;
    this.password = password;
    this.role = role;
    this.fullName = fullName;
  }

  public get id(): string {
    return this._id;
  }
  private set id(value: string) {
    this._id = value;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }
  private set createdAt(value: Date) {
    this._createdAt = z.date().parse(value);
  }

  public get email(): string {
    return this._email;
  }
  private set email(value: string) {
    this._email = z.string().email().parse(value);
  }

  public get password(): string {
    return this._password;
  }
  private set password(value: string) {
    this._password = z.string().min(1).parse(value);
  }

  public get role(): Role {
    return this._role;
  }
  private set role(value: Role) {
    this._role = z.nativeEnum(Role).parse(value);
  }

  public get fullName(): FullName {
    return this._fullName;
  }
  private set fullName(value: FullName) {
    this._fullName = value;
  }

  toSnapshot(): UserSnapshot {
    return {
      id: this._id,
      createdAt: this._createdAt,
      email: this._email,
      password: this._password,
      role: this._role,
      firstName: this._fullName.firstName,
      lastName: this._fullName.lastName,
    };
  }

  static fromSnapshot(snapshot: UserSnapshot): User {
    return new User(
      snapshot.id,
      snapshot.createdAt,
      snapshot.email,
      snapshot.password,
      snapshot.role,
      new FullName(snapshot.firstName, snapshot.lastName),
    );
  }

  static async register(
    email: string,
    password: string,
    role: Role,
    firstName: string,
    lastName: string,
  ): Promise<User> {
    const uuidGenerator = DomainRegistry.uuidGenerator();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    const encryptedPassword = await this.asEncryptedValue(password);

    const user = new User(
      uuidGenerator.generate(),
      currentDate,
      email,
      encryptedPassword,
      role,
      new FullName(firstName, lastName),
    );

    return user;
  }

  private static async asEncryptedValue(password: string): Promise<string> {
    return await DomainRegistry.encryptionProvider().encryptedValue(password);
  }
}
