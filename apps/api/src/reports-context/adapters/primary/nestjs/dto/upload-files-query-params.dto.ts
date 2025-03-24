import { createZodDto } from 'nestjs-zod';
import { uploadFilesQueryParamsDtoSchema } from 'shared-models';

export class UploadFilesQueryParamsDto extends createZodDto(
  uploadFilesQueryParamsDtoSchema,
) {}
