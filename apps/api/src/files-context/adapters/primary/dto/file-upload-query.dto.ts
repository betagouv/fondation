import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const fileUploadQueryDtoSchema = z.object({
  bucket: z.string(),
  path: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : [value]))
    .nullable(),
  fileId: z.string(),
});

export class FileUploadQueryDto extends createZodDto(
  fileUploadQueryDtoSchema,
) {}
