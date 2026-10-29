import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { isDefined } from '../../../../utils/is-defined';
import { USER_STATUSES } from '../../../shared/user-status.enum';
import { MEMBER_FORMATIONS } from '../member.utils';

export class ListMembersQueryDto extends createZodDto(
  z.object({
    sortBy: z.enum(['firstName', 'lastName']).optional(),
    sortDirection: z.enum(['asc', 'desc']).default('asc').optional(),
    search: z.string().trim().optional(),
    formations: z.preprocess(
      (x) => (isDefined(x) ? ([] as unknown[]).concat(x) : x),
      z.array(z.enum(MEMBER_FORMATIONS)).optional(),
    ),
    statuses: z.preprocess(
      (x) => (isDefined(x) ? ([] as unknown[]).concat(x) : x),
      z.array(z.enum(USER_STATUSES)).nonempty().default(['ACTIVE']),
    ),
  }),
) {}
