import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class ExcludeJurisdictionsDto extends createZodDto(
  z.object({ jurisdictionIds: z.array(z.string()) }),
) {}

const MemberSortableFields = ['lastName', 'firstName', 'role'] as const;
export type MemberSortField = (typeof MemberSortableFields)[number];

export class ListMembersQueryDto extends createZodDto(
  z.looseObject({
    search: z.string().optional(),
    sortField: z.enum(MemberSortableFields).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
  }),
) {}
