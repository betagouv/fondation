import { createZodDto } from 'nestjs-zod';
import { dossierDeNominationEtAffectationSchema } from 'shared-models';

export class DossierDeNominationEtAffectationParamsNestDto extends createZodDto(
  dossierDeNominationEtAffectationSchema,
) {}
