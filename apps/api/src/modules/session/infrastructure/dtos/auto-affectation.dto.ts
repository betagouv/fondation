import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export class AutoAffectationDto extends createZodDto(
  z.object({
    nominationFileIds: z.array(z.uuid()).nonempty().optional(),
  }),
) {}
