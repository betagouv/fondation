import { Magistrat } from 'shared-models';
import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
import { UserService } from 'src/shared-kernel/business-logic/gateways/services/user.service';

type FullName = string;

export class FakeUserService implements UserService {
  private users: Record<FullName, UserDescriptorSerialized> = {};
  private usersById: Record<string, UserDescriptorSerialized> = {};

  async userWithId(userId: string): Promise<UserDescriptorSerialized> {
    return this.usersById[userId]!;
  }

  async userWithFullName(name: FullName): Promise<UserDescriptorSerialized> {
    return this.users[name]!;
  }

  async usersByFormation(
    formation: Magistrat.Formation,
  ): Promise<UserDescriptorSerialized[]> {
    console.log(formation);
    return [...Object.values(this.users)];
  }

  addUsers(...someUsers: (UserDescriptorSerialized & { fullName: string })[]) {
    someUsers.forEach((aUser) => {
      const { fullName, ...user } = aUser;
      this.users[fullName] = user;
    });
  }
}
