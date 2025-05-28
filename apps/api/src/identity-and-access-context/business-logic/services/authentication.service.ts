import { UserRepository } from '../gateways/repositories/user-repository';
import { DomainRegistry } from '../models/domain-registry';
import { User } from '../models/user';

export class AuthenticationService {
  constructor(private readonly userRepository: UserRepository) {}

  async authenticate(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.userWithEmail(email);
    if (!user) return null;

    const samePassword =
      await DomainRegistry.encryptionProvider().comparePasswords(
        password,
        user.password,
      );

    if (samePassword) return user;
    return null;
  }
}
