import { createZodDto } from 'nestjs-zod';
import { deleteAttachedFilesQuerySchema } from 'shared-models';

export class DeleteAttachedFilesQueryDto extends createZodDto(
  deleteAttachedFilesQuerySchema,
) {}
