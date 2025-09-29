import { Magistrat } from 'shared-models';
import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';

export interface UserService {
  userWithId(reporterId: string): Promise<UserDescriptorSerialized>;
  userWithFullName(fullName: string): Promise<UserDescriptorSerialized>;
  usersByFormation(
    formation: Magistrat.Formation,
  ): Promise<UserDescriptorSerialized[]>;
}
