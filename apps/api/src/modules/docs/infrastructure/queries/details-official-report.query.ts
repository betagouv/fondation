import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class DetailsOfficialReportQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { officialReportId: string }): Promise<DetailedOfficialReportMetadataDto> {
    const report = await this.prisma.officialReport.findUnique({
      where: { id: query.officialReportId },
      select: {
        id: true,
        hasRenunciation: true,
        agendas: { select: { id: true } },
        members: { select: { memberId: true } },
        justiceDepartmentContactId: true,
        secretaryId: true,
        chairmanId: true,
        sessionMeetingDate: true,
        sessionMeetingStartingTime: true,
        sessionMeetingEndingTime: true,
      },
    });

    if (!report) throw new NotFoundException();

    return {
      id: report.id,
      hasRenunciation: report.hasRenunciation,
      agendas: report.agendas.map(({ id }) => id).filter(isDefined),
      members: report.members.map(({ memberId }) => memberId).filter(isDefined),
      chairmanId: report.chairmanId,
      secretaryId: report.secretaryId,
      justiceDepartmentContactId: report.justiceDepartmentContactId?.toString() ?? null,
      sessionMeetingDate: DateOnly.fromDate(report.sessionMeetingDate).toJson(),
      sessionMeetingStartingTime: dateToTimeOnly(report.sessionMeetingStartingTime),
      sessionMeetingEndingTime: dateToTimeOnly(report.sessionMeetingEndingTime),
    };
  }
}

export class DetailedOfficialReportMetadataDto extends createZodDto(
  z.object({
    id: z.string(),
    hasRenunciation: z.boolean(),
    members: z.array(z.string()),
    agendas: z.array(z.uuid()),
    sessionMeetingDate: dateOnlyJsonSchema,
    sessionMeetingStartingTime: timeOnlySchema,
    sessionMeetingEndingTime: timeOnlySchema,
    chairmanId: z.string().nullable(),
    secretaryId: z.string().nullable(),
    justiceDepartmentContactId: z.string().nullable(),
  }),
) {}
