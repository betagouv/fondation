import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import z from 'zod';

import { AgendaRenderContext, AgendaRenderer } from '../services/renderers/agenda.renderer';
import { USER_TITLES } from 'src/modules/administration/domain/user-enum';
import { Db } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';

@Injectable()
export class FindAgendaDocumentQuery {
  constructor(
    private readonly db: Db,
    private readonly agendaRenderer: AgendaRenderer,
  ) {}

  @Transactional()
  async handle(query: { id: string; forceNew?: boolean }): Promise<string> {
    if (!query.forceNew) {
      const agenda = await this.db.tx.agenda.findUnique({
        where: { id: query.id },
        select: { id: true, html: true },
      });

      if (!agenda) throw new NotFoundException();
      if (agenda.html) return agenda.html;
    }

    const ctx = await this.db.tx.agenda.findUnique({
      where: { id: query.id },
      select: {
        id: true,
        date: true,
        formation: true,
        sessionMeetingDate: true,
        chairmanFirstName: true,
        chairmanLastName: true,
        chairmanGender: true,
        chairmanTitle: true,
        nominationFiles: {
          select: {
            id: true,
            grade: true,
            name: true,
            number: true,
            outcome: true,
            outcomeComment: true,
            position: true,
            reporters: true,
            targetedGrade: true,
            targetedPosition: true,
          },
        },
      },
    });

    if (!ctx) throw new NotFoundException();

    const renderContext: AgendaRenderContext = {
      date: ctx.date,
      formation: prismaFormationEnumToFormationEnum(ctx.formation),
      sessionMeetingDate: ctx.sessionMeetingDate,
      chairman: {
        firstName: ctx.chairmanFirstName,
        lastName: ctx.chairmanLastName,
        title: z.enum(USER_TITLES).nullable().catch(null).parse(ctx.chairmanTitle),
        gender: prismaGenderEnumToGenderEnum(ctx.chairmanGender),
      },
      nominationFiles: ctx.nominationFiles.map((f) => ({
        name: f.name,
        currentGrade: f.grade,
        currentPosition: f.position,
        targetedPosition: f.targetedPosition,
        targetedGrade: f.targetedGrade,
        outcome: f.outcome,
        outcomeComment: f.outcomeComment,
        reporters: f.reporters,
      })),
    };

    const html = this.agendaRenderer.html(renderContext);
    await this.db.tx.agenda.update({
      where: { id: query.id },
      data: { html },
    });

    return html;
  }
}
