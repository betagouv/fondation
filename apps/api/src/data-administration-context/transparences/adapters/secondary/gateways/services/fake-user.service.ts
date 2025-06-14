import { UserService } from 'src/data-administration-context/transparences/business-logic/gateways/services/user.service';
import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';

type FullName = string;

export class FakeUserService implements UserService {
  private users: Record<FullName, UserDescriptorSerialized> = {};

  async userWithFullName(name: FullName): Promise<UserDescriptorSerialized> {
    return this.users[name]!;
  }

  addUsers(...someUsers: (UserDescriptorSerialized & { fullName: string })[]) {
    someUsers.forEach((aUser) => {
      const { fullName, ...user } = aUser;
      this.users[fullName] = user;
    });
  }
}
