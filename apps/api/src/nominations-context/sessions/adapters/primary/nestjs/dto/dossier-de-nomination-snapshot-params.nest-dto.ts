import { createZodDto } from 'nestjs-zod';
import { dossierDeNominationSnapshotParamsSchema } from 'shared-models';

export class DossierDeNominationSnapshotParamsNestDto extends createZodDto(
  dossierDeNominationSnapshotParamsSchema,
) {}
