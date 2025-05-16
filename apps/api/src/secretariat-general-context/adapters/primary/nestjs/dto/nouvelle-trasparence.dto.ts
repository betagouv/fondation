import { createZodDto } from 'nestjs-zod';
import { nouvelleTransparenceDtoSchema } from 'shared-models';

export class NouvelleTransparenceDto extends createZodDto(
  nouvelleTransparenceDtoSchema,
) {}
