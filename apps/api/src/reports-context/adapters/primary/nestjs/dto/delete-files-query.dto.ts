import { createZodDto } from 'nestjs-zod';
import { deleteReportFilesQuerySchema } from 'shared-models';

export class DeleteFilesQueryDto extends createZodDto(
  deleteReportFilesQuerySchema,
) {}
