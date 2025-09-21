import { createZodDto } from 'nestjs-zod';
import { sessionIdParamsSchema } from 'shared-models';

export class SessionIdParamsNestDto extends createZodDto(
  sessionIdParamsSchema,
) {}
