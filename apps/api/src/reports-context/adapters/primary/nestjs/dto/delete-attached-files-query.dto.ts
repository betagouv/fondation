import { createZodDto } from 'nestjs-zod';
import { deleteFilesQuerySchema } from 'shared-models';

export class DeleteFilesQueryDto extends createZodDto(deleteFilesQuerySchema) {}
