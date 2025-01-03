import { Role } from 'src/identity-and-access-context/business-logic/models/role';
import { identityAndAccessContextSchema } from './identity-and-access-context-schema.drizzle';

export const roleEnum = identityAndAccessContextSchema.enum(
  'role',
  Object.values(Role) as [Role, ...Role[]],
);
