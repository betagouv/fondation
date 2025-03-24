import { createZodDto } from 'nestjs-zod';
import { uploadFilesParamsDtoSchema } from 'shared-models';

export class UploadFilesParamsDto extends createZodDto(
  uploadFilesParamsDtoSchema,
) {}
