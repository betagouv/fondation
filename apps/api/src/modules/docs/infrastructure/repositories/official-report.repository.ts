import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';
import { timeOnlyToDate } from 'src/utils/time-only';
import {
  OfficialReport,
  OfficialReportCreated,
} from '../../domain/official-report';

@Injectable()
export class OfficialReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  persist(report: OfficialReport): Promise<unknown> {
    return this.prisma.$transaction(
      report.messages.map((message) => {
        if (message instanceof OfficialReportCreated) {
          return this.persistOfficialReportCreated(message);
        } else {
          return assertNever(message);
        }
      }),
    );
  }

  private persistOfficialReportCreated(message: OfficialReportCreated) {
    return this.prisma.officialReport.create({
      data: {
        id: message.id,
        sessionMeetingDate: message.sessionMeetingDate.toDate(),
        sessionMeetingStartingTime: timeOnlyToDate(
          message.sessionMeetingStartingTime,
        ),
        hasRenunciation: message.hasRenunciation,
        justiceDepartmentContactId: message.justiceDepartmentContactId,
        chairmanId: message.chairman.id,
        chairmanFirstName: message.chairman.firstName,
        chairmanLastName: message.chairman.lastName,
        chairmanGender: message.chairman.gender,
        chairmanTitle: message.chairman.title,
        secretaryId: message.secretary.id,
        secretaryFirstName: message.secretary.firstName,
        secretaryLastName: message.secretary.lastName,
        secretaryGender: message.secretary.gender,
        secretaryTitle: message.secretary.title,
        authorId: message.authorId,
        agendas: { connect: message.agendaIds.map((id) => ({ id })) },
        members: {
          createMany: {
            data: message.members.map((m) => ({
              memberId: m.id,
              firstName: m.firstName,
              lastName: m.lastName,
              gender: m.gender,
              title: m.title,
            })),
          },
        },
      },
    });
  }
}
