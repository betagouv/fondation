import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { writerOf, writerSchema } from '../../../../../utils/user.util';
import { Db } from '../../../../framework/database';
import { NominationFileAttachmentTypeEnum } from '../../../../shared/nomination-file-attachment-type.enum';
import {
  canUpdateNominationFile,
  nominationFileLock,
} from '../../../../shared/policies/nomination-file.policies';
import type { RoleEnum } from '../../../../shared/role.enum';
import { SessionReportedFilesFinder } from '../finders/session-reported-files.finder';
import { NominationSessionFinder } from '../finders/transparence-session.finder';

@Injectable()
export class ListNominationFileAttachmentsQuery {
  constructor(
    private readonly db: Db,
    private readonly reportedFiles: SessionReportedFilesFinder,
    private readonly sessions: NominationSessionFinder,
  ) {}

  @Transactional()
  async handle(query: {
    nominationFileId: string;
    role: RoleEnum;
    sessionId: string;
  }): Promise<ListedNominationFileAttachmentDto> {
    const session = await this.sessions.getVisible(query);
    const nominationFile = await this.db.tx.dossierDeNomination.findUnique({
      select: {
        attachments: {
          orderBy: { createdAt: 'desc' },
          select: {
            createdAt: true,
            file: {
              select: {
                createdBy: { select: { firstName: true, id: true, lastName: true } },
                id: true,
                name: true,
                sizeInBytes: true,
              },
            },
            type: true,
          },
        },
      } satisfies Prisma.DossierDeNominationSelect,
      where: { id: query.nominationFileId, sessionId: query.sessionId },
    });

    if (!nominationFile) throw new NotFoundException();

    const reportedFileIds = await this.reportedFiles.find({
      nominationFileIds: new Set([query.nominationFileId]),
    });
    const lockedReason = nominationFileLock(
      { isReported: reportedFileIds.has(query.nominationFileId) },
      session,
    );
    return {
      canManageAttachments: canUpdateNominationFile({ lockedReason }, query),
      items: nominationFile.attachments.map(({ createdAt, file, type }) => ({
        id: file.id,
        name: file.name,
        size: file.sizeInBytes,
        type,
        addedAt: createdAt.toISOString(),
        addedBy: writerOf(file.createdBy),
      })),
    };
  }
}

export class ListedNominationFileAttachmentDto extends createZodDto(
  z.object({
    canManageAttachments: z
      .boolean()
      .describe('adding, renaming or detaching the files: a locked dossier takes none, unlike its synthèse'),
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        size: z.number().int().nullable(),
        type: z.enum(NominationFileAttachmentTypeEnum),
        addedAt: z.iso.datetime(),
        addedBy: writerSchema,
      }),
    ),
  }),
) {}
