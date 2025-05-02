import { Gender } from 'shared-models';
import { z } from 'zod';
import { FullName } from './full-name';

export class Person {
  constructor(
    private readonly _fullName: FullName,
    private _gender: Gender,
  ) {}

  public get fullName(): FullName {
    return this._fullName;
  }

  public get gender(): Gender {
    return this._gender;
  }
  private set gender(value: Gender) {
    this._gender = z.nativeEnum(Gender).parse(value);
  }
}
