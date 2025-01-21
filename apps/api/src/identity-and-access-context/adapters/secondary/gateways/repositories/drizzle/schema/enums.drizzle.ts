import { Role } from 'src/identity-and-access-context/business-logic/models/role';
import { identityAndAccessContextSchema } from './identity-and-access-context-schema.drizzle';
import { Gender } from 'src/identity-and-access-context/business-logic/models/gender';

export const roleEnum = identityAndAccessContextSchema.enum(
  'role',
  Object.values(Role) as [Role, ...Role[]],
);

export const genderEnum = identityAndAccessContextSchema.enum(
  'gender',
  Object.values(Gender) as [Gender, ...Gender[]],
);
