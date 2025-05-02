import { Gender, Role } from 'shared-models';
import { FileType } from 'src/identity-and-access-context/business-logic/use-cases/file-read-permission/has-read-file-permission.use-case';
import { identityAndAccessContextSchema } from './identity-and-access-context-schema.drizzle';

export const roleEnum = identityAndAccessContextSchema.enum(
  'role',
  Object.values(Role) as [Role, ...Role[]],
);

export const genderEnum = identityAndAccessContextSchema.enum(
  'gender',
  Object.values(Gender) as [Gender, ...Gender[]],
);

export const fileTypeEnum = identityAndAccessContextSchema.enum(
  'file_type',
  Object.values(FileType) as [FileType, ...FileType[]],
);
