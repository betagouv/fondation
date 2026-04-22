import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';
import { makeId } from 'src/utils/id';
import {
  Agenda,
  AgendaCreated,
  AgendaDeleted,
  AgendaUpdated,
} from '../../domain/agenda';

@Injectable()
export class AgendaRepository {
  constructor(private readonly prisma: PrismaService) {}

  persist(agenda: Agenda): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      for (const message of agenda.messages) {
        if (message instanceof AgendaCreated) {
          await this.persistAgendaCreated(tx, message);
        } else if (message instanceof AgendaUpdated) {
          await this.persistAgendaUpdated(tx, message);
        } else if (message instanceof AgendaDeleted) {
          await this.persistAgendaDeleted(tx, message);
        } else {
          assertNever(message);
        }
      }
    });
  }

  async find(query: { agendaId: string }): Promise<Agenda> {
    const foundAgenda = await this.prisma.agenda.findUnique({
      select: { id: true, sessionId: true },
      where: { id: query.agendaId },
    });

    if (!foundAgenda) throw new NotFoundException();

    return Agenda.from({
      id: makeId('AgendaId', foundAgenda.id),
      sessionId: makeId('SessionId', foundAgenda.sessionId),
    });
  }

  private async persistAgendaCreated(
    tx: Prisma.TransactionClient,
    message: AgendaCreated,
  ) {
    const { formation, name } = await tx.session.findUniqueOrThrow({
      where: { id: message.sessionId },
      select: { formation: true, name: true },
    });

    return tx.agenda.create({
      data: {
        formation,
        sessionName: name.trim(),
        id: message.agendaId,
        chairmanFirstName: message.chairman.firstName,
        chairmanLastName: message.chairman.lastName,
        chairmanGender: message.chairman.gender,
        date: message.date,
        sessionMeetingDate: message.sessionMeetingDate,
        createdBy: message.authorId,
        chairmanId: message.chairman.id,
        chairmanTitle: message.chairman.title,
        chairmanDisplayTitle: message.chairman.displayTitle,
        sessionId: message.sessionId,
        nominationFiles: {
          createMany: {
            data: message.nominationFiles.map((file) => ({
              grade: file.grade,
              name: file.name,
              position: file.currentPosition,
              number: file.number,
              targetedGrade: file.targetedGrade,
              targetedPosition: file.targetedPosition,
              nominationFileId: file.id,
              outcome: file.outcome.value,
              outcomeComment: file.outcome.comment,
              reporters: file.reporters as string[],
            })),
          },
        },
      },
    });
  }

  private async persistAgendaUpdated(
    tx: Prisma.TransactionClient,
    message: AgendaUpdated,
  ) {
    await tx.agendaNominationFile.deleteMany({
      where: { agendaId: message.agendaId },
    });

    const agenda = await tx.agenda.findFirst({
      select: { pdf: { select: { id: true } }, officialReportId: true },
      where: { id: message.agendaId },
    });

    if (agenda?.pdf?.id) {
      await tx.agenda.update({
        where: { id: message.agendaId },
        data: { pdfFileId: null },
      });

      await tx.file.deleteMany({
        where: { id: agenda.pdf.id },
      });
    }

    if (agenda?.officialReportId) {
      await tx.officialReport.delete({
        where: { id: agenda.officialReportId },
      });
    }

    await tx.agenda.update({
      where: { id: message.agendaId },
      data: {
        html: null,
        id: message.agendaId,
        chairmanFirstName: message.chairman.firstName,
        chairmanLastName: message.chairman.lastName,
        chairmanGender: message.chairman.gender,
        date: message.date,
        sessionMeetingDate: message.sessionMeetingDate,
        createdBy: message.authorId,
        chairmanId: message.chairman.id,
        chairmanTitle: message.chairman.title,
        chairmanDisplayTitle: message.chairman.displayTitle,
        nominationFiles: {
          createMany: {
            data: message.nominationFiles.map((file) => ({
              grade: file.grade,
              name: file.name,
              position: file.currentPosition,
              number: file.number,
              targetedGrade: file.targetedGrade,
              targetedPosition: file.targetedPosition,
              nominationFileId: file.id,
              outcome: file.outcome.value,
              outcomeComment: file.outcome.comment,
              reporters: file.reporters as string[],
            })),
          },
        },
      },
    });
  }

  private async persistAgendaDeleted(
    tx: Prisma.TransactionClient,
    message: AgendaDeleted,
  ) {
    await tx.agenda.update({
      where: { id: message.agendaId },
      data: { pdf: { delete: {} }, officialReport: { delete: {} } },
    });

    await tx.agenda.delete({
      where: { id: message.agendaId },
    });
  }
}
