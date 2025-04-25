import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';

export interface UserService {
  userWithFullName(fullName: string): Promise<UserDescriptorSerialized>;
}
