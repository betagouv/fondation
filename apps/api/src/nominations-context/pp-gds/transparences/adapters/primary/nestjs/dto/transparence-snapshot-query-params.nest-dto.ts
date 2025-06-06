import { createZodDto } from 'nestjs-zod';
import { transparenceSnapshotQueryParamsSchema } from 'shared-models';

export class TransparenceSnapshotQueryParamsNestDto extends createZodDto(
  transparenceSnapshotQueryParamsSchema,
) {}
