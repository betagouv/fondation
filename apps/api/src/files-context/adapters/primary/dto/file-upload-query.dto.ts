import { createZodDto } from 'nestjs-zod';
import { fileUploadQueryDtoSchema } from 'shared-models';

export class FileUploadQueryDto extends createZodDto(
  fileUploadQueryDtoSchema,
) {}
