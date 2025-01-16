import { z } from 'zod';

export class FullName {
  private constructor(
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

  static fromString(fullName: string): FullName {
    const sanitizedFullName = fullName.trim();
    const [firstName, lastName] = FullName.firstAndLastName(sanitizedFullName);
    return new FullName(firstName, lastName);
  }

  private static firstAndLastName(fullName: string): [string, string] {
    const lastSpaceIndex = fullName.lastIndexOf(' ');
    const lastName = fullName.substring(0, lastSpaceIndex).trim();
    const firstName = fullName.substring(lastSpaceIndex + 1).trim();

    return [firstName, lastName];
  }
}
