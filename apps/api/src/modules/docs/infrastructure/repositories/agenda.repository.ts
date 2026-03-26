import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';
import { Agenda, AgendaCreated } from '../../domain/agenda';

@Injectable()
export class AgendaRepository {
  constructor(private readonly prisma: PrismaService) {}

  persist(agenda: Agenda) {
    return this.prisma.$transaction(
      agenda.messages.map((message) => {
        if (message instanceof AgendaCreated) {
          return this.persistAgendaCreated(message);
        }

        return assertNever(message);
      }),
    );
  }

  private persistAgendaCreated(message: AgendaCreated) {
    return this.prisma.agenda.create({
      data: {
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
              magistratCivilite: file.magistratCivilite ?? null,
              magistratCurrentPosition: file.magistratCurrentPosition ?? null,
              magistratCurrentGrade: file.magistratCurrentGrade ?? null,
            })),
          },
        },
      },
    });
  }
}
