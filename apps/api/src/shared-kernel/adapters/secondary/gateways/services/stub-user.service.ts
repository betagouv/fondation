import { Magistrat } from 'shared-models';
import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
import { UserService } from 'src/shared-kernel/business-logic/gateways/services/user.service';

export class StubUserService implements UserService {
  user: UserDescriptorSerialized;

  async userWithId(reporterId: string): Promise<UserDescriptorSerialized> {
    if (this.user.userId !== reporterId) throw new Error('User not found.');
    return this.user;
  }

  async userWithFullName(): Promise<UserDescriptorSerialized> {
    return this.user;
  }

  async usersByFormation(
    formation: Magistrat.Formation,
  ): Promise<UserDescriptorSerialized[]> {
    console.log('formation', formation);
    return [this.user];
  }
}
