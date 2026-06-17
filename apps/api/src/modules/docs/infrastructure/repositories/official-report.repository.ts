import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import { DocNominationFileOutcomeEnum } from '../../domain/doc-nomination-file-outcome';
import {
  OfficialReport,
  OfficialReportCreated,
  OfficialReportDeleted,
  OfficialReportUpdated,
} from '../../domain/official-report';
import { DocsNominationFilesFinder } from '../finders/docs-nomination-files.finder';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { assertNever } from 'src/utils/assert-never';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';
import { timeOnlyToDate } from 'src/utils/time-only';

@Injectable()
export class OfficialReportRepository {
  private readonly logger = new Logger(OfficialReportRepository.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly nominationFilesFinder: DocsNominationFilesFinder,
  ) {}

  async find(query: { id: string; tx?: Prisma.TransactionClient }): Promise<OfficialReport> {
    if (!query.tx) return this.prisma.$transaction((tx) => this.find({ ...query, tx }));

    const report = await query.tx.officialReport.findUnique({
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

  async persist(report: OfficialReport, tx?: Prisma.TransactionClient): Promise<void> {
    if (!tx) return this.prisma.$transaction((tx) => this.persist(report, tx));

    for (const message of report.messages) {
      if (message instanceof OfficialReportCreated || message instanceof OfficialReportUpdated) {
        await this.persistOfficialReportCreatedOrUpdated(tx, message);
      } else if (message instanceof OfficialReportDeleted) {
        await this.persistOfficialReportDeleted(tx, message);
      } else {
        assertNever(message);
      }
    }
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

    const agendas = await tx.agenda.findMany({
      where: { id: { in: message.agendaIds as string[] } },
      select: {
        sessionId: true,
        nominationFiles: {
          select: { nominationFileId: true },
          where: { nominationFileId: { not: null } },
        },
      },
    });

    const nominationFiles = await Promise.all(
      agendas.map((agenda) =>
        this.nominationFilesFinder.find({
          tx,
          sessionId: agenda.sessionId,
          ids: agenda.nominationFiles.flatMap((nf) => (nf.nominationFileId ? [nf.nominationFileId] : [])),
        }),
      ),
    ).then((result) => result.flatMap(({ items }) => items));

    const nominationFilesCreateMany = nominationFiles
      .filter((file) => OfficialReportRepository.hasOutcome(file))
      .map(
        (f) =>
          ({
            nominationFileId: f.id,
            number: f.number,
            name: f.magistrat.name,
            grade: f.magistrat.position.grade,
            position: f.magistrat.position.label,
            targetedPosition: f.targetPosition.label,
            targetedGrade: f.targetPosition.grade,
            outcome: f.outcome.value,
            outcomeComment: f.outcome.comment,
            reporters: f.reporters.map((r) => r.fullTitledName),
          }) satisfies Prisma.OfficialReportNominationFileUncheckedCreateWithoutOfficialReportInput,
      );

    // Supprimer l'ancien snapshot avant mise à jour
    await tx.officialReportNominationFile.deleteMany({
      where: { officialReportId: message.id },
    });

    return tx.officialReport.upsert({
      where: { id: message.id },
      create: {
        id: message.id,
        html: null,
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
              isAbsent: m.isAbsent,
              sort: m.sort,
            })),
          },
        },
        nominationFiles: {
          createMany: { data: nominationFilesCreateMany },
        },
      },
      update: {
        html: null,
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
              isAbsent: m.isAbsent,
              sort: m.sort,
            })),
          },
        },
        nominationFiles: {
          createMany: { data: nominationFilesCreateMany },
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

    await tx.officialReport.delete({
      where: { id: message.officialReportId },
    });

    if (report?.pdfId) {
      await tx.file.deleteMany({
        where: { id: report.pdfId },
      });
    }
  }

  private static hasOutcome<
    T extends { outcome: { value: DocNominationFileOutcomeEnum; comment: string | null } | null },
  >(file: T): file is T & { outcome: NonNullable<T['outcome']> } {
    return isDefined(file.outcome);
  }
}
