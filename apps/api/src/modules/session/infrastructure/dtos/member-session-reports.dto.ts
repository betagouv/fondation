import { createZodDto } from 'nestjs-zod';
import { NominationFile } from 'shared-models';
import z from 'zod';

const ReportSortableFields = [
  'folderNumber',
  'name',
  'grade',
  'targettedPosition',
  'state',
] as const;
export type ReportSortField = (typeof ReportSortableFields)[number];

const toArray = <T>(val: T | T[] | undefined): T[] | undefined =>
  val === undefined ? undefined : Array.isArray(val) ? val : [val];

export class ListMemberSessionReportsQueryDto extends createZodDto(
  z.looseObject({
    states: z.preprocess(
      toArray,
      z.array(z.nativeEnum(NominationFile.ReportState)).optional(),
    ),
    sortField: z.enum(ReportSortableFields).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
  }),
) {}
