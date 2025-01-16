import { z } from 'zod';
import { User } from './user';

export type UserDescriptorSerialized = {
  userId: string;
  firstName: string;
  lastName: string;
};

export class UserDescriptor {
  constructor(
    private _userId: string,
    private _firstName: string,
    private _lastName: string,
  ) {}

  public get userId(): string {
    return this._userId;
  }
  private set userId(value: string) {
    this._userId = z.string().min(1).parse(value);
  }

  public get firstName(): string {
    return this._firstName;
  }
  private set firstName(value: string) {
    this._firstName = z.string().min(1).parse(value);
  }

  public get lastName(): string {
    return this._lastName;
  }
  private set lastName(value: string) {
    this._lastName = z.string().min(1).parse(value);
  }

  serialize(): UserDescriptorSerialized {
    return {
      userId: this.userId,
      firstName: this.firstName,
      lastName: this.lastName,
    };
  }

  static fromUser(user: User) {
    return new UserDescriptor(user.id, user.firstName, user.lastName);
  }
}
