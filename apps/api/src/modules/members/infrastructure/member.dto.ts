import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class ExcludeJurisdictionsDto extends createZodDto(
  z.object({ jurisdictionIds: z.array(z.string()) }),
) {}
