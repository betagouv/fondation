import { z } from 'zod';

export class FullName {
  constructor(
    private _firstName: string,
    private _lastName: string,
  ) {
    this.firstName = _firstName;
    this.lastName = _lastName;
  }

  public get lastName(): string {
    return this._lastName;
  }
  private set lastName(value: string) {
    const lastName = this.lowerCase(value);
    this._lastName = z.string().min(1).parse(lastName);
  }

  public get firstName(): string {
    return this._firstName;
  }
  private set firstName(value: string) {
    const firstName = this.lowerCase(value);
    this._firstName = z.string().min(1).parse(firstName);
  }

  private lowerCase(value: string): string {
    return value.toLowerCase();
  }

  static unaccentedFromString(fullName: string): FullName {
    const sanitizedFullName = fullName.trim();
    const [firstName, lastName] = FullName.firstAndLastName(sanitizedFullName);
    return new FullName(this.unaccent(firstName), this.unaccent(lastName));
  }

  private static firstAndLastName(fullName: string): [string, string] {
    const lastSpaceIndex = fullName.lastIndexOf(' ');
    const lastName = fullName.substring(0, lastSpaceIndex).trim();
    const firstName = fullName.substring(lastSpaceIndex + 1).trim();

    return [firstName, lastName];
  }

  private static unaccent(value: string): string {
    // Split characters into the base character plus their diacritic mark,
    // then remove the diacritic mark with a regex.
    // https://en.wikipedia.org/wiki/Combining_Diacritical_Marks
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
