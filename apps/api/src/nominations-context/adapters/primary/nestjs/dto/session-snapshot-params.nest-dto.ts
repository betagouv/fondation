import { createZodDto } from 'nestjs-zod';
import { sessionSnapshotParamsSchema } from 'shared-models';

export class SessionSnapshotParamsNestDto extends createZodDto(
  sessionSnapshotParamsSchema,
) {}
