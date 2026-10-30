import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { DateOnly } from '../../../../../utils/date-only';
import { writerOf } from '../../../../../utils/user.util';
import { Db } from '../../../../framework/database';
import { prismaFormationEnumToFormationEnum } from '../../../../shared/mappers/formation.mapper';
import { prismaGenderEnumToGenderEnum } from '../../../../shared/mappers/gender-enum.mapper';
import { USER_TITLES } from '../../../../shared/user-title.enum';
import type { AgendaRenderContext } from '../services/renderers/agenda.renderer';

import { AgendaVersionFinder } from './agenda-version.finder';

@Injectable()
export class AgendaRenderContextFinder {
  constructor(
    private readonly db: Db,
    private readonly agendaVersionFinder: AgendaVersionFinder,
  ) {}

  @Transactional()
  async find(query: { agendaId: string }): Promise<AgendaRenderContext> {
    const versionId = await this.agendaVersionFinder.latest({ agendaId: query.agendaId });

    const agenda = await this.db.tx.agendaVersion.findUnique({
      where: { id: versionId },
      select: {
        date: true,
        agenda: { select: { formation: true } },
        sessionMeetingDate: true,
        chairmanFirstName: true,
        chairmanLastName: true,
        chairmanGender: true,
        chairmanTitle: true,
        nominationFiles: {
          orderBy: { number: 'asc' },
          select: {
            id: true,
            nominationFileId: true,
            grade: true,
            name: true,
            number: true,
            position: true,
            reporters: true,
            targetedGrade: true,
            targetedPosition: true,
            htmlEdited: true,
            htmlOutdated: true,
            htmlEditedAt: true,
            editor: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      } satisfies Prisma.AgendaVersionSelect,
    });

    if (!agenda) throw new NotFoundException();

    const userDefinedFiles = new Map(
      agenda.nominationFiles
        .filter((f): f is typeof f & { htmlEdited: string } => Boolean(f.htmlEdited?.trim()))
        .map(
          (f) =>
            [
              f.id,
              {
                html: f.htmlEdited,
                isOutdated: f.htmlOutdated,
                editedAt: f.htmlEditedAt,
                editedBy: writerOf(f.editor),
              },
            ] as const,
        ),
    );

    return {
      date: DateOnly.fromUtcDate(agenda.date),
      formation: prismaFormationEnumToFormationEnum(agenda.agenda.formation),
      sessionMeetingDate: DateOnly.fromUtcDate(agenda.sessionMeetingDate),
      chairman: {
        firstName: agenda.chairmanFirstName,
        lastName: agenda.chairmanLastName,
        title: z.enum(USER_TITLES).nullable().catch(null).parse(agenda.chairmanTitle),
        gender: prismaGenderEnumToGenderEnum(agenda.chairmanGender),
      },
      nominationFiles: agenda.nominationFiles.map((f) => ({
        id: f.id,
        nominationFileId: f.nominationFileId,
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
