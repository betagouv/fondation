import { createZodDto } from 'nestjs-zod';
import { saveAffectationsRapporteursSchema } from 'shared-models';

export class SaveAffectationsRapporteursNestDto extends createZodDto(
  saveAffectationsRapporteursSchema,
) {}
