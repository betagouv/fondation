import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';

import { PrismaService } from 'src/modules/framework/database';

import { DocRenderer } from '../services/doc-renderer.service';

@Injectable()
export class GenerateAgendaPdfQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly renderer: DocRenderer,
  ) {}

  async handle(query: { agendaId: string }): Promise<StreamableFile> {
    const agenda = await this.prisma.agenda.findUnique({
      where: { id: query.agendaId },
      select: {
        date: true,
        sessionMeetingDate: true,
        chairmanFirstName: true,
        chairmanLastName: true,
        chairmanTitle: true,
        chairmanGender: true,
        nominationFiles: {
          orderBy: { number: 'asc' },
          select: {
            number: true,
            name: true,
            grade: true,
            position: true,
            targetedPosition: true,
            targetedGrade: true,
            outcome: true,
            outcomeComment: true,
          },
        },
      },
    });

    if (!agenda) throw new NotFoundException();

    const buffer = await this.renderer.agenda.pdf({
      date: agenda.date,
      sessionMeetingDate: agenda.sessionMeetingDate,
      chairman: {
        firstName: agenda.chairmanFirstName,
        lastName: agenda.chairmanLastName,
        title: agenda.chairmanTitle,
        gender: agenda.chairmanGender,
      },
      nominationFiles: agenda.nominationFiles,
    });

    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `inline; filename="agenda-${query.agendaId}.pdf"`,
    });
  }
}
