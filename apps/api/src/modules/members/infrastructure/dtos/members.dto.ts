import { createZodDto } from 'nestjs-zod';
import { Magistrat } from 'shared-models';
import z from 'zod';

export class ListMembersQueryDto extends createZodDto(
  z.object({
    search: z.string().trim().nonempty().optional(),
    formation: z.enum(Magistrat.Formation).optional(),
  }),
) {}
