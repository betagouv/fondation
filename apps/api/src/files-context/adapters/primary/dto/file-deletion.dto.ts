import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class FileDeletionParamDto extends createZodDto(
  z.object({
    id: z.string(),
  }),
) {}
