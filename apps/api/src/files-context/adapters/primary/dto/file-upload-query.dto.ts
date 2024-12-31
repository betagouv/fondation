import { createZodDto } from 'nestjs-zod';
import { fileUploadQueryDtoSchema } from 'shared-models/models/endpoints/files';

export class FileUploadQueryDto extends createZodDto(
  fileUploadQueryDtoSchema,
) {}
