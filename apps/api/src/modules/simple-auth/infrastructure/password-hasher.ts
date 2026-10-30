import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { API_CONFIG_TOKEN, ApiConfig } from '../../framework/config';
import { AuthPassword } from '../domain/auth-password';

@Injectable()
export class PasswordHasher {
  // The hash of a value drawn at startup and kept nowhere: comparing with it takes as long as with a real password, and never matches
  readonly decoy: AuthPassword;

  private readonly cost: number;

  constructor(@Inject(API_CONFIG_TOKEN) config: ApiConfig) {
    this.cost = config.passwordHashCost;
    this.decoy = AuthPassword.from(bcrypt.hashSync(crypto.randomUUID(), this.cost));
  }

  async hash(plain: string): Promise<AuthPassword> {
    return AuthPassword.from(await bcrypt.hash(plain, this.cost));
  }

  isOutdated(password: AuthPassword): boolean {
    return password.cost !== this.cost;
  }
}
