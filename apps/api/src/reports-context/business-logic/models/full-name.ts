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

  fullName(): string {
    return `${this.upperCase(this.lastName)} ${this.capitalized(this.firstName)}`;
  }

  private lowerCase(value: string): string {
    return value.toLowerCase();
  }

  private upperCase(value: string): string {
    return value.toUpperCase();
  }

  private capitalized(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
