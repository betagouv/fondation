import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { createSortableDto } from '../../../framework/sorting';
import { ADMIN_USER_ROLES_ENUM, AdminUserRoleEnum } from '../../../shared/admin-user-role.enum';
import { GenderEnum } from '../../../shared/gender.enum';
import { PasswordSchema } from '../../../shared/password.schema';
import { RoleEnum } from '../../../shared/role.enum';
import { USER_STATUSES, UserStatus } from '../../../shared/user-status.enum';

export class ListUsersQueryDto extends createSortableDto(
  z.object({
    sortBy: z.enum(['lastName']).optional(),
    search: z.string().trim().optional(),
    roles: z
      .union([z.enum(ADMIN_USER_ROLES_ENUM), z.array(z.enum(ADMIN_USER_ROLES_ENUM))])
      .optional()
      .transform((x) => (x ? ([] as AdminUserRoleEnum[]).concat(x) : x)),
    statuses: z
      .union([z.enum(USER_STATUSES), z.array(z.enum(USER_STATUSES))])
      .optional()
      .transform((x) => (x ? ([] as UserStatus[]).concat(x) : x)),
  }),
) {}

export class CreateUserDto extends createZodDto(
  z.object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    firstName: z.string().trim().nonempty(),
    gender: z.enum(GenderEnum),
    lastName: z.string().trim().nonempty(),
    password: PasswordSchema,
    role: z.enum(ADMIN_USER_ROLES_ENUM),
  }),
) {}

export class CreatedUserDto extends createZodDto(z.object({ id: z.uuid() })) {}

export class UpdateUserEmailDto extends createZodDto(
  z.object({ email: z.string().trim().toLowerCase().pipe(z.email()) }),
) {}

export class UpdateUserPasswordDto extends createZodDto(z.object({ password: PasswordSchema })) {}

export class UpdateUserRoleDto extends createZodDto(z.object({ role: z.enum(ADMIN_USER_ROLES_ENUM) })) {}

export class UpdateUserDisplayTitleDto extends createZodDto(
  z.object({ displayTitle: z.string().nullable() }),
) {}

export class RegisterUserDto extends createZodDto(
  z.object({
    email: z.email().toLowerCase(),
    firstName: z.string(),
    gender: z.enum(GenderEnum),
    isAdmin: z.boolean().optional(),
    lastName: z.string(),
    password: PasswordSchema,
    role: z.enum(RoleEnum).nullish(),
  }),
) {}

export class RegisteredUserDto extends createZodDto(z.object({ id: z.uuid() })) {}
