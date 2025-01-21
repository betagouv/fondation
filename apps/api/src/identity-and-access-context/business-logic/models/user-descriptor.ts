import { z } from 'zod';
import { User } from './user';
import { FullName } from './full-name';

export type UserDescriptorSerialized = {
  userId: string;
  firstName: string;
  lastName: string;
};

export class UserDescriptor {
  private constructor(
    private _userId: string,
    private _fullName: FullName,
  ) {}

  public get userId(): string {
    return this._userId;
  }
  private set userId(value: string) {
    this._userId = z.string().min(1).parse(value);
  }

  serialize(): UserDescriptorSerialized {
    return {
      userId: this.userId,
      firstName: this._fullName.firstName,
      lastName: this._fullName.lastName,
    };
  }

  static fromUser(user: User) {
    return new UserDescriptor(user.id, user.fullName);
  }
}
