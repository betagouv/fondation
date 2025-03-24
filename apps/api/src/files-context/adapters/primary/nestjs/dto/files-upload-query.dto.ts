import { createZodDto } from 'nestjs-zod';
import { filesUploadQueryDtoSchema } from 'shared-models';

export class FilesUploadQueryDto extends createZodDto(
  filesUploadQueryDtoSchema,
) {}
