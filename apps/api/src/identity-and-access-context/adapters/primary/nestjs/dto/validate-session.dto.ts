import { createZodDto } from 'nestjs-zod';
import { validateSessionDtoSchema } from 'shared-models';

export class ValidateSessionNestDto extends createZodDto(
  validateSessionDtoSchema,
) {}
