import * as bcrypt from 'bcrypt';

export class AuthPassword {
  private constructor(readonly hash: string) {}

  static async create(plain: string): Promise<AuthPassword> {
    return new AuthPassword(await this.hash(plain));
  }

  static from(hash: string): AuthPassword {
    return new AuthPassword(hash);
  }

  equals(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.hash);
  }

  toString(): string {
    return this.hash;
  }

  private static hash(plain: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      bcrypt.hash(plain, 10, (err, hash) => {
        if (err) return reject(err);
        return resolve(hash);
      });
    });
  }
}
