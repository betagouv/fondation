import { z } from 'zod';
import { User } from './user';
import { Gender } from './gender';

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
    private _gender: Gender | null,
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

  public get gender(): Gender | null {
    return this._gender;
  }
  private set gender(value: Gender | null) {
    this._gender = value;
  }

  serialize(): UserDescriptorSerialized {
    return {
      userId: this.userId,
      firstName: this.firstName,
      lastName: this.lastName,
    };
  }

  static fromUser(user: User) {
    return new UserDescriptor(
      user.id,
      user.person.fullName.firstName,
      user.person.fullName.lastName,
      user.person.gender,
    );
  }
}
