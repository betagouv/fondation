import { Injectable, NotFoundException } from '@nestjs/common';
import z from 'zod';

import {
  type OfficialReportRenderContext,
  OfficialReportRenderer,
} from '../services/renderers/official-report.renderer';
import { USER_TITLES } from 'src/modules/administration/domain/user-enum';
import { PrismaService } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { DateOnly } from 'src/utils/date-only';

@Injectable()
export class FindOfficialReportDocumentQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly officialReportRenderer: OfficialReportRenderer,
  ) {}

  handle(query: { id: string; forceNew?: boolean }): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      if (!query.forceNew) {
        const report = await tx.officialReport.findUnique({
          where: { id: query.id },
          select: { id: true, html: true },
        });

        if (!report) throw new NotFoundException();
        if (report.html) return report.html;
      }

      const ctx = await tx.officialReport.findUnique({
        where: { id: query.id },
        select: {
          sessionMeetingDate: true,
          sessionMeetingStartingTime: true,
          sessionMeetingEndingTime: true,
          hasRenunciation: true,
          justiceDepartmentContactName: true,
          chairmanId: true,
          chairmanFirstName: true,
          chairmanLastName: true,
          chairmanTitle: true,
          chairmanDisplayTitle: true,
          chairmanGender: true,
          secretaryId: true,
          secretaryFirstName: true,
          secretaryLastName: true,
          secretaryTitle: true,
          secretaryDisplayTitle: true,
          secretaryGender: true,
          members: {
            select: {
              memberId: true,
              firstName: true,
              lastName: true,
              gender: true,
              title: true,
              isAbsent: true,
              sort: true,
            },
          },
          nominationFiles: {
            select: {
              name: true,
              grade: true,
              position: true,
              targetedPosition: true,
              targetedGrade: true,
              outcome: true,
              reporters: true,
            },
          },
          agendas: {
            select: {
              sessionId: true,
              formation: true,
              date: true,
            },
          },
        },
      });

      if (!ctx) throw new NotFoundException();

      const agenda = ctx.agendas[0];
      if (!agenda) throw new NotFoundException();

      const session = await tx.session.findUnique({
        where: { id: agenda.sessionId, deletedAt: null },
        select: { date: true },
      });
      if (!session) throw new NotFoundException();

      const chairmanTitle = await z
        .enum(USER_TITLES)
        .exclude(['FIRST_SECRETARY'])
        .nullable()
        .catch(null)
        .parseAsync(ctx.chairmanTitle);

      const renderContext: OfficialReportRenderContext = {
        formation: prismaFormationEnumToFormationEnum(agenda.formation),
        sessionMeetingDate: DateOnly.fromDate(ctx.sessionMeetingDate),
        hasRenouncement: ctx.hasRenunciation,
        justiceDepartmentContact: ctx.justiceDepartmentContactName,
        agendaDate: DateOnly.fromDate(agenda.date),
        sessionDate: DateOnly.fromDate(session.date),
        sessionMeetingTime: {
          hours: ctx.sessionMeetingStartingTime.getHours(),
          minutes: ctx.sessionMeetingStartingTime.getMinutes(),
        },
        sessionMeetingEndTime: {
          hours: ctx.sessionMeetingEndingTime.getHours(),
          minutes: ctx.sessionMeetingEndingTime.getMinutes(),
        },
        chairman: {
          id: ctx.chairmanId,
          firstName: ctx.chairmanFirstName,
          lastName: ctx.chairmanLastName,
          gender: prismaGenderEnumToGenderEnum(ctx.chairmanGender),
          title: chairmanTitle,
          displayTitle: ctx.chairmanDisplayTitle,
        },
        secretary: {
          id: ctx.secretaryId,
          firstName: ctx.secretaryFirstName,
          lastName: ctx.secretaryLastName,
          gender: prismaGenderEnumToGenderEnum(ctx.secretaryGender),
          title: ctx.secretaryTitle === 'FIRST_SECRETARY' ? 'FIRST_SECRETARY' : null,
          displayTitle: ctx.secretaryDisplayTitle,
        },
        members: ctx.members.map((m) => ({
          id: m.memberId,
          firstName: m.firstName,
          lastName: m.lastName,
          gender: prismaGenderEnumToGenderEnum(m.gender),
          displayTitle: m.title,
          isAbsent: m.isAbsent,
          sort: m.sort,
        })),
        files: ctx.nominationFiles.flatMap((f) => {
          if (!f.outcome) return [];

          return [
            {
              name: f.name,
              currentGrade: f.grade,
              currentPosition: f.position,
              targetedPosition: f.targetedPosition ?? '',
              targetedGrade: f.targetedGrade,
              reporters: f.reporters,
              outcome: f.outcome,
            },
          ];
        }),
      };

      const html = this.officialReportRenderer.html(renderContext);
      await tx.officialReport.update({
        where: { id: query.id },
        data: { html },
      });

      return html;
    });
  }
}
