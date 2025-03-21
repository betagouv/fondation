import { createZodDto } from 'nestjs-zod';
import { attachFileQuerySchema } from 'shared-models';

export class AttachFileQueryParams extends createZodDto(
  attachFileQuerySchema,
) {}
