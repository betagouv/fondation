import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';
import { timeOnlyToDate } from 'src/utils/time-only';
import {
  OfficialReport,
  OfficialReportCreated,
} from '../../domain/official-report';

@Injectable()
export class OfficialReportRepository {
  private readonly logger = new Logger(OfficialReportRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  persist(report: OfficialReport): Promise<unknown> {
    return this.prisma.$transaction(async (tx) => {
      for (const message of report.messages) {
        if (message instanceof OfficialReportCreated) {
          await this.persistOfficialReportCreated(tx, message);
        } else {
          assertNever(message);
        }
      }
    });
  }

  private async persistOfficialReportCreated(
    tx: Prisma.TransactionClient,
    message: OfficialReportCreated,
  ) {
    const justiceContact = await tx.justiceDepartmentContact.findUnique({
      where: { id: message.justiceDepartmentContactId },
      select: { name: true },
    });

    if (!justiceContact) {
      this.logger.error(
        `Unknown justice contact "${message.justiceDepartmentContactId}"`,
      );
      throw new InternalServerErrorException();
    }

    const justiceContactName = justiceContact.name.trim();
    if (!justiceContactName) {
      this.logger.error(
        `justice contact "${message.justiceDepartmentContactId}" name is empty`,
      );
      throw new InternalServerErrorException();
    }

    return this.prisma.officialReport.create({
      data: {
        id: message.id,
        sessionMeetingDate: message.sessionMeetingDate.toDate(),
        sessionMeetingStartingTime: timeOnlyToDate(
          message.sessionMeetingStartingTime,
        ),
        hasRenunciation: message.hasRenunciation,
        justiceDepartmentContactId: message.justiceDepartmentContactId,
        justiceDepartmentContactName: justiceContact.name,
        chairmanId: message.chairman.id,
        chairmanFirstName: message.chairman.firstName,
        chairmanLastName: message.chairman.lastName,
        chairmanGender: message.chairman.gender,
        chairmanTitle: message.chairman.title,
        chairmanDisplayTitle: message.chairman.displayTitle,
        secretaryId: message.secretary.id,
        secretaryFirstName: message.secretary.firstName,
        secretaryLastName: message.secretary.lastName,
        secretaryGender: message.secretary.gender,
        secretaryTitle: message.secretary.title,
        secretaryDisplayTitle: message.secretary.displayTitle,
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
