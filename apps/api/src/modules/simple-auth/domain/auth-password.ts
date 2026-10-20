import * as bcrypt from 'bcrypt';

export class AuthPassword {
  private constructor(readonly hash: string) {}

  static from(hash: string): AuthPassword {
    return new AuthPassword(hash);
  }

  equals(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.hash);
  }

  toString(): string {
    return this.hash;
  }
}
