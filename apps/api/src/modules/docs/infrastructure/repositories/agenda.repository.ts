import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';
import { Agenda, AgendaCreated } from '../../domain/agenda';

@Injectable()
export class AgendaRepository {
  constructor(private readonly prisma: PrismaService) {}

  persist(agenda: Agenda) {
    return this.prisma.$transaction(async (tx) => {
      for (const message of agenda.messages) {
        if (message instanceof AgendaCreated) {
          await this.persistAgendaCreated(tx, message);
        } else {
          assertNever(message);
        }
      }
    });
  }

  private async persistAgendaCreated(
    tx: Prisma.TransactionClient,
    message: AgendaCreated,
  ) {
    const { formation } = await tx.session.findUniqueOrThrow({
      where: { id: message.sessionId },
      select: { formation: true },
    });

    return tx.agenda.create({
      data: {
        formation,
        id: message.agendaId,
        chairmanFirstName: message.chairman.firstName,
        chairmanLastName: message.chairman.lastName,
        chairmanGender: message.chairman.gender,
        date: message.date,
        sessionMeetingDate: message.sessionMeetingDate,
        createdBy: message.authorId,
        chairmanId: message.chairman.id,
        chairmanTitle: message.chairman.title,
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
}
