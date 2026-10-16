import * as bcrypt from 'bcrypt';

const COST = 10;

export class AuthPassword {
  // The hash of a value drawn at startup and kept nowhere: comparing with it takes as long as with a real password, and never matches
  static readonly DECOY = new AuthPassword(bcrypt.hashSync(crypto.randomUUID(), COST));

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
      bcrypt.hash(plain, COST, (err, hash) => {
        if (err) return reject(err);
        return resolve(hash);
      });
    });
  }
}
