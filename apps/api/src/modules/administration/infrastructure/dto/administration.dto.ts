import { createZodDto } from 'nestjs-zod';
import { Role } from 'shared-models';
import { createSortableDto } from 'src/modules/framework/sorting';
import z from 'zod';
import { USER_DUTIES, USER_TITLES } from '../../domain/user';

export class ListUsersQueryDto extends createSortableDto(
  z.object({
    sortBy: z.enum(['firstName', 'lastName', 'email']).optional(),
    search: z.string().trim().optional(),
  }),
) {}

export class UpdateUserEmailDto extends createZodDto(z.object({ email: z.email() })) {}
export class UpdateUserPasswordDto extends createZodDto(z.object({ password: z.string().min(8) })) {}
export class UpdateUserRoleDto extends createZodDto(z.object({ role: z.enum(Role) })) {}
export class UpdateUserTitleDto extends createZodDto(z.object({ title: z.enum(USER_TITLES).nullable() })) {}
export class UpdateUserDutyDto extends createZodDto(z.object({ duty: z.enum(USER_DUTIES).nullable() })) {}
export class UpdateUserDisplayTitleDto extends createZodDto(z.object({ displayTitle: z.string().nullable() })) {}
