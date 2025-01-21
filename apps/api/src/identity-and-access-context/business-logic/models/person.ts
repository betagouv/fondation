import { z } from 'zod';
import { FullName } from './full-name';
import { Gender } from './gender';

export class Person {
  constructor(
    private readonly _fullName: FullName,
    private _gender: Gender | null,
  ) {}

  public get fullName(): FullName {
    return this._fullName;
  }

  public get gender(): Gender | null {
    return this._gender;
  }
  private set gender(value: Gender | null) {
    this._gender = z.nativeEnum(Gender).nullable().parse(value);
  }
}
