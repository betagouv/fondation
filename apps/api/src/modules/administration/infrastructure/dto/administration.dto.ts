import { createZodDto } from 'nestjs-zod';
import { createSortableDto } from 'src/modules/framework/sorting';
import z from 'zod';
import {
  ADMIN_USER_ROLES_ENUM,
  AdminUserRoleEnum,
} from '../../domain/user-enum';

export class ListUsersQueryDto extends createSortableDto(
  z.object({
    sortBy: z.enum(['lastName']).optional(),
    search: z.string().trim().optional(),
    roles: z
      .union([
        z.enum(ADMIN_USER_ROLES_ENUM),
        z.array(z.enum(ADMIN_USER_ROLES_ENUM)),
      ])
      .optional()
      .transform((x) => (x ? ([] as AdminUserRoleEnum[]).concat(x) : x)),
  }),
) {}

export class UpdateUserEmailDto extends createZodDto(
  z.object({ email: z.email() }),
) {}

export class UpdateUserPasswordDto extends createZodDto(
  z.object({ password: z.string().min(8) }),
) {}

export class UpdateUserRoleDto extends createZodDto(
  z.object({ role: z.enum(ADMIN_USER_ROLES_ENUM) }),
) {}

export class UpdateUserDisplayTitleDto extends createZodDto(
  z.object({ displayTitle: z.string().nullable() }),
) {}
