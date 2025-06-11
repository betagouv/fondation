import { createZodDto } from 'nestjs-zod';
import { importNouvelleTransparenceDtoSchema } from 'shared-models';

export class ImportNouvelleTransparenceXlsxNestDto extends createZodDto(
  importNouvelleTransparenceDtoSchema,
) {}
