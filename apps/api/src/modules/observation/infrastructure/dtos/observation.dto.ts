import z from 'zod';
import { createZodDto } from 'nestjs-zod';

export class CreateObservationDto extends createZodDto(
  z.object({
    files: z.array(z.file()).optional(),
    magistratId: z.uuid(),
    dateReception: z.iso.date(),
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
    search: z.string().min(2),
    limit: z.coerce.number().min(1).max(50).optional(),
  }),
) {}

export class UpdateObservationDto extends createZodDto(
  z.object({
    files: z.array(z.file()).optional(),
    magistratId: z.uuid(),
    dateReception: z.iso.date(),
    detachFileIds: z.array(z.string()).optional(),
  }),
) {}
