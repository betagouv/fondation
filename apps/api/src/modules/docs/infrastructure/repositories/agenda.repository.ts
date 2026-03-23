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
        sessionId: message.sessionId,
        authorId: message.authorId,
        nominationFiles: {
          createMany: {
            skipDuplicates: true,
            data: message.nominationFileIds.map((nominationFileId) => ({
              nominationFileId,
            })),
          },
        },
      },
    });
  }
}
