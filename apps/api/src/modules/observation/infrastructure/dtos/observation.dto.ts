import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { ObservationFollowUp } from '../../domain/observation-follow-up';

export class CreateObservationDto extends createZodDto(
  z.object({
    files: z.array(z.file()).optional(),
    magistratId: z.uuid(),
    dateReception: z.iso.date(),
    description: z.string().nullish(),
  }),
) {}

export class CreateObservationResponseDto extends createZodDto(
  z.object({ id: z.string() }),
) {}

export class ListObservationsQueryDto extends createZodDto(
  z.object({
    nominationFileId: z.uuid().optional(),
  }),
) {}

export class SearchMagistratsQueryDto extends createZodDto(
  z.object({ search: z.string().min(2).optional() }),
) {}

export class UpdateObservationDto extends createZodDto(
  z.object({
    files: z.array(z.file()).optional(),
    magistratId: z.uuid(),
    dateReception: z.iso.date(),
    description: z.string().nullish(),
    detachFileIds: z
      .union([z.string(), z.array(z.string())])
      .transform((x) => ([] as string[]).concat(x))
      .optional(),
  }),
) {}

export class FollowUpOnObservationDto extends createZodDto(
  z.object({
    followUp: z.enum(ObservationFollowUp.enum).nullable(),
    comment: z.string().trim().nullable(),
  }),
) {}
