import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import z from 'zod';

import type { AgendaRenderContext } from '../services/renderers/agenda.renderer';
import { USER_TITLES } from 'src/modules/administration/domain/user-enum';
import { Db } from 'src/modules/framework/database';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';

@Injectable()
export class AgendaRenderContextFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async find(query: { agendaId: string }): Promise<AgendaRenderContext> {
    const agenda = await this.db.tx.agenda.findUnique({
      where: { id: query.agendaId },
      select: {
        date: true,
        formation: true,
        sessionMeetingDate: true,
        chairmanFirstName: true,
        chairmanLastName: true,
        chairmanGender: true,
        chairmanTitle: true,
        nominationFiles: {
          orderBy: { number: 'asc' },
          select: {
            id: true,
            grade: true,
            name: true,
            number: true,
            position: true,
            reporters: true,
            targetedGrade: true,
            targetedPosition: true,
            htmlEdited: true,
            htmlOutdated: true,
          },
        },
      },
    });

    if (!agenda) throw new NotFoundException();

    const userDefinedFiles = new Map(
      agenda.nominationFiles
        .filter((f): f is typeof f & { htmlEdited: string } => Boolean(f.htmlEdited?.trim()))
        .map((f) => [f.id, { html: f.htmlEdited, isOutdated: f.htmlOutdated }] as const),
    );

    return {
      date: agenda.date,
      formation: prismaFormationEnumToFormationEnum(agenda.formation),
      sessionMeetingDate: agenda.sessionMeetingDate,
      chairman: {
        firstName: agenda.chairmanFirstName,
        lastName: agenda.chairmanLastName,
        title: z.enum(USER_TITLES).nullable().catch(null).parse(agenda.chairmanTitle),
        gender: prismaGenderEnumToGenderEnum(agenda.chairmanGender),
      },
      nominationFiles: agenda.nominationFiles.map((f) => ({
        id: f.id,
        number: f.number,
        name: f.name,
        currentGrade: f.grade,
        currentPosition: f.position,
        targetedPosition: f.targetedPosition,
        targetedGrade: f.targetedGrade,
        reporters: f.reporters,
      })),
      userDefinedBlocks: { files: userDefinedFiles },
    };
  }
}
