import { createZodDto } from 'nestjs-zod';
import { deleteFilesQuerySchema } from 'shared-models';

export class FilesDeletionQueryDto extends createZodDto(
  deleteFilesQuerySchema,
) {}
