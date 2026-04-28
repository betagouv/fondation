import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { ObservationFollowUp } from '../../domain/observation-follow-up';

const linkedObservationsAttachmentsMultipartSchema = z
  .array(z.object({ observationId: z.string(), fileId: z.string() }))
  .default([]);

export class CreateObservationDto extends createZodDto(
  z.object({
    files: z.array(z.file()).optional(),
    form: z.object({
      magistratId: z.uuid(),
      dateReception: z.iso.date(),
      description: z.string().nullish(),
      linkedObservationsAttachments:
        linkedObservationsAttachmentsMultipartSchema,
    }),
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
  z.object({
    search: z.string().min(2).optional(),
    ignore: z
      .string()
      .optional()
      .transform((x) => (x ?? '').split(',').filter((x) => !!x))
      .pipe(z.array(z.uuid())),
  }),
) {}

export class UpdateObservationDto extends createZodDto(
  z.object({
    files: z.array(z.file()).optional(),
    form: z.object({
      magistratId: z.uuid(),
      dateReception: z.iso.date(),
      description: z.string().nullish(),
      detachFileIds: z
        .union([z.string(), z.array(z.string())])
        .transform((x) => ([] as string[]).concat(x))
        .optional(),
      linkedObservationsAttachments:
        linkedObservationsAttachmentsMultipartSchema,
    }),
  }),
) {}

export class FollowUpOnObservationDto extends createZodDto(
  z.object({
    followUp: z.enum(ObservationFollowUp.enum).nullable(),
    comment: z.string().trim().nullable(),
  }),
) {}

export class ListObservationsAttachmentsQueryDto extends createZodDto(
  z.object({
    magistratId: z.string().optional(),
    excludeObservationId: z.string().optional(),
  }),
) {}
