import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
import { UserService } from 'src/reports-context/business-logic/gateways/services/user.service';

export class StubUserService implements UserService {
  user: { userId: string };

  async userWithFullName(): Promise<UserDescriptorSerialized> {
    return {
      userId: this.user.userId,
      firstName: 'Fake',
      lastName: 'Reporter',
    };
  }
}
