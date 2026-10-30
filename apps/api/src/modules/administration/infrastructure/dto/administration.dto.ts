import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { createSortableDto } from '../../../framework/sorting';
import {
  ADMIN_USER_ROLES_ENUM,
  AdminUserRoleEnum,
  adminUserRoleLabel,
} from '../../../shared/admin-user-role.enum';
import { GenderEnum } from '../../../shared/gender.enum';
import { PasswordSchema } from '../../../shared/password.schema';
import { RoleEnum } from '../../../shared/role.enum';
import { USER_STATUSES, UserStatus } from '../../../shared/user-status.enum';
import { AdminUserRole } from '../../domain/admin-user-role';
import {
  ADMIN_USER_ROLE_GROUPS,
  adminUserRoleGroupLabel,
  adminUserRolesOf,
} from '../../domain/admin-user-role-group';

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

export const LabeledAdminUserRoleSchema = z.object({ id: z.enum(ADMIN_USER_ROLES_ENUM), label: z.string() });

export function labeledAdminUserRole(
  role: AdminUserRoleEnum,
  gender: GenderEnum | undefined,
): z.infer<typeof LabeledAdminUserRoleSchema> {
  return { id: role, label: adminUserRoleLabel(role, gender) };
}

export const ServedAdminUserRoleSchema = LabeledAdminUserRoleSchema.extend({
  group: z.enum(ADMIN_USER_ROLE_GROUPS),
});

export function servedAdminUserRole(
  role: AdminUserRole,
  gender: GenderEnum,
): z.infer<typeof ServedAdminUserRoleSchema> {
  return { ...labeledAdminUserRole(role.toString(), gender), group: role.group };
}

export class ListAdminUserRolesQueryDto extends createZodDto(
  z.object({ gender: z.enum(GenderEnum).optional() }),
) {}

export class ListedAdminUserRolesDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.enum(ADMIN_USER_ROLE_GROUPS),
        label: z.string(),
        roles: z.array(LabeledAdminUserRoleSchema),
      }),
    ),
  }),
) {}

export function listedAdminUserRoles(gender: GenderEnum | undefined): ListedAdminUserRolesDto {
  return {
    items: ADMIN_USER_ROLE_GROUPS.map((group) => ({
      id: group,
      label: adminUserRoleGroupLabel[group],
      roles: adminUserRolesOf(group).map((role) => labeledAdminUserRole(role, gender)),
    })),
  };
}

export class CreateUserDto extends createZodDto(
  z.object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    firstName: z.string().trim().nonempty(),
    gender: z.enum(GenderEnum),
    isTechnical: z.boolean().default(false),
    lastName: z.string().trim().nonempty(),
    password: PasswordSchema,
    role: z.enum(ADMIN_USER_ROLES_ENUM),
  }),
) {}

export class CreatedUserDto extends createZodDto(z.object({ id: z.uuid() })) {}

export class UpdateUserEmailDto extends createZodDto(
  z.object({ email: z.string().trim().toLowerCase().pipe(z.email()) }),
) {}

/** each part is edited on its own, for two edits in a row not to overwrite one another */
export class UpdateUserNameDto extends createZodDto(
  z
    .object({
      firstName: z.string().trim().nonempty().optional(),
      lastName: z.string().trim().nonempty().optional(),
    })
    .refine(({ firstName, lastName }) => firstName !== undefined || lastName !== undefined, {
      message: 'Le nom ou le prénom est attendu',
    }),
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
    isTechnical: z.boolean().optional(),
    lastName: z.string(),
    password: PasswordSchema,
    role: z.enum(RoleEnum).nullish(),
  }),
) {}

export class RegisteredUserDto extends createZodDto(z.object({ id: z.uuid() })) {}
