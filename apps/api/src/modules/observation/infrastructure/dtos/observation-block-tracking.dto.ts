import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { OBSERVATION_BLOCK_TRACKING_STATUSES } from '../../domain/observation-block-tracking';

export const ObservationBlockTrackingSchema = z.object({
  status: z.enum(OBSERVATION_BLOCK_TRACKING_STATUSES),
  comment: z.string().nullable(),
});

export class UpdateObservationBlockTrackingDto extends createZodDto(ObservationBlockTrackingSchema) {}
