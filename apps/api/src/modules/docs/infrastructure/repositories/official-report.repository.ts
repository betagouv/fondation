import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import {
  OfficialReport,
  OfficialReportCreated,
  OfficialReportDeleted,
  OfficialReportUpdated,
} from '../../domain/official-report';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { assertNever } from 'src/utils/assert-never';
import { assertIsDefined } from 'src/utils/is-defined';
import { timeOnlyToDate } from 'src/utils/time-only';

@Injectable()
export class OfficialReportRepository {
  private readonly logger = new Logger(OfficialReportRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async find(query: { id: string }): Promise<OfficialReport> {
    const report = await this.prisma.officialReport.findUnique({
      where: { id: query.id },
      select: { id: true, agendas: { select: { formation: true }, take: 1 } },
    });

    if (!report) throw new NotFoundException();

    const formation = assertIsDefined(
      report.agendas[0]?.formation,
      `official report ${query.id} has unknown formation`,
    );

    return OfficialReport.from({
      id: report.id,
      formation: prismaFormationEnumToFormationEnum(formation),
    });
  }

  persist(report: OfficialReport): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      for (const message of report.messages) {
        if (message instanceof OfficialReportCreated || message instanceof OfficialReportUpdated) {
          await this.persistOfficialReportCreatedOrUpdated(tx, message);
        } else if (message instanceof OfficialReportDeleted) {
          await this.persistOfficialReportDeleted(tx, message);
        } else {
          assertNever(message);
        }
      }
    });
  }

  private async persistOfficialReportCreatedOrUpdated(
    tx: Prisma.TransactionClient,
    message: OfficialReportCreated | OfficialReportUpdated,
  ) {
    const justiceContact = await tx.justiceDepartmentContact.findUnique({
      where: { id: BigInt(message.justiceDepartmentContactId) },
      select: { id: true, name: true },
    });

    if (!justiceContact) {
      this.logger.error(`Unknown justice contact "${message.justiceDepartmentContactId}"`);
      throw new InternalServerErrorException();
    }

    const justiceContactName = justiceContact.name.trim();
    if (!justiceContactName) {
      this.logger.error(`justice contact "${message.justiceDepartmentContactId}" name is empty`);
      throw new InternalServerErrorException();
    }

    return this.prisma.officialReport.upsert({
      where: { id: message.id },
      create: {
        id: message.id,
        sessionMeetingDate: message.sessionMeetingDate.toDate(),
        sessionMeetingStartingTime: timeOnlyToDate(message.sessionMeetingStartingTime),
        sessionMeetingEndingTime: timeOnlyToDate(message.sessionMeetingEndingTime),
        hasRenunciation: message.hasRenunciation,
        justiceDepartmentContactId: justiceContact.id,
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
      update: {
        sessionMeetingDate: message.sessionMeetingDate.toDate(),
        sessionMeetingStartingTime: timeOnlyToDate(message.sessionMeetingStartingTime),
        hasRenunciation: message.hasRenunciation,
        justiceDepartmentContactId: justiceContact.id,
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
          deleteMany: {},

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

  private async persistOfficialReportDeleted(tx: Prisma.TransactionClient, message: OfficialReportDeleted) {
    await tx.agenda.updateMany({
      where: { officialReportId: message.officialReportId },
      data: { officialReportId: null },
    });

    const report = await tx.officialReport.findUnique({
      where: { id: message.officialReportId },
      select: { pdfId: true },
    });

    if (report?.pdfId) {
      await tx.file.delete({
        where: { id: report.pdfId },
      });
    }

    await tx.officialReport.delete({
      where: { id: message.officialReportId },
    });
  }
}
