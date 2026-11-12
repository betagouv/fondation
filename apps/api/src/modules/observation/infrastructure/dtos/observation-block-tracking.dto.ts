import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { OBSERVATION_BLOCK_TRACKING_STATUSES } from '../../domain/observation-block';

export const ObservationBlockTrackingSchema = z.object({
  status: z.enum(OBSERVATION_BLOCK_TRACKING_STATUSES),
  comment: z.string().max(2_000).nullable(),
});

export class UpdateObservationBlockTrackingDto extends createZodDto(ObservationBlockTrackingSchema) {}
