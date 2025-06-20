import { createZodDto } from 'nestjs-zod';
import { importObservantsXlsxDtoSchema } from 'shared-models';

export class ImportObservantsXlsxNestDto extends createZodDto(
  importObservantsXlsxDtoSchema,
) {}
