import { UserSnapshot } from 'src/identity-and-access-context/business-logic/models/user';
import {
  UserDescriptor,
  UserDescriptorSerialized,
} from 'src/identity-and-access-context/business-logic/models/user-descriptor';

export const expectUserDescriptor = (
  userDescriptor: UserDescriptor,
  expectedUser: UserSnapshot,
) => {
  expect(userDescriptor.serialize()).toEqual<UserDescriptorSerialized>({
    userId: expectedUser.id,
    firstName: expectedUser.firstName,
    lastName: expectedUser.lastName,
    role: expectedUser.role,
  });
};
