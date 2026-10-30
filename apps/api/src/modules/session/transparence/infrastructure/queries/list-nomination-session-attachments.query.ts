import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { writerOf, writerSchema } from '../../../../../utils/user.util';
import { Db } from '../../../../framework/database';
import type { RoleEnum } from '../../../../shared/role.enum';
import { NominationSessionFinder } from '../finders/transparence-session.finder';

@Injectable()
export class ListNominationSessionAttachmentsQuery {
  constructor(
    private readonly db: Db,
    private readonly sessions: NominationSessionFinder,
  ) {}

  async handle(query: { role: RoleEnum; sessionId: string }): Promise<ListedNominationSessionAttachmentDto> {
    await this.sessions.getVisible(query);
    const session = await this.db.tx.session.findUnique({
      select: {
        attachments: {
          orderBy: { file: { createdAt: 'desc' } },
          select: {
            file: {
              select: {
                createdAt: true,
                createdBy: { select: { firstName: true, id: true, lastName: true } },
                id: true,
                name: true,
                sizeInBytes: true,
              },
            },
          },
        },
      } satisfies Prisma.SessionSelect,
      where: { deletedAt: null, id: query.sessionId },
    });

    if (!session) throw new NotFoundException();
    return {
      items: session.attachments.map(({ file }) => ({
        id: file.id,
        name: file.name,
        addedAt: file.createdAt.toISOString(),
        addedBy: writerOf(file.createdBy),
        size: file.sizeInBytes,
      })),
    };
  }
}

export class ListedNominationSessionAttachmentDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        name: z.string(),
        id: z.string(),
        addedAt: z.iso.datetime(),
        addedBy: writerSchema,
        size: z.number().int().nullable(),
      }),
    ),
  }),
) {}
