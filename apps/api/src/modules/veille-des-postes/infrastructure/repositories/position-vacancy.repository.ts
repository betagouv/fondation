import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { assertNever } from '../../../../utils/assert-never';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import { Files } from '../../../framework/files';
import {
  hasLapsed,
  PositionVacancy,
  PositionVacancyAttachmentRemoved,
  PositionVacancyAttachmentRenamed,
  PositionVacancyDeclared,
  PositionVacancyWithdrawn,
} from '../../domain/position-vacancy';
import { HeldPositionFinder } from '../finders/held-position.finder';

@Injectable()
export class PositionVacancyRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly files: Files,
    private readonly heldPositions: HeldPositionFinder,
  ) {}

  /**
   * the vacancies whose magistrat LOLFI moved or let go: no route reaches them any more, and their documents
   * (death certificates, disciplinary decisions) would stay for nothing. Answers how many were deleted
   */
  @Transactional()
  async deleteLapsed(): Promise<number> {
    const vacancies = await this.db.tx.positionVacancy.findMany({
      select: {
        attachments: { select: { file: { select: { id: true, path: true } } } },
        magistrat: { select: { currentPositionId: true, status: true } },
        magistratId: true,
        positionId: true,
      } satisfies Prisma.PositionVacancySelect,
    });
    const lapsed = vacancies.filter((vacancy) => hasLapsed(vacancy, vacancy.magistrat));
    if (lapsed.length === 0) return 0;

    await this.db.tx.positionVacancy.deleteMany({
      where: {
        OR: lapsed.map(({ magistratId, positionId }) => ({ magistratId, positionId })),
      },
    });
    this.files.delete(lapsed.flatMap(({ attachments }) => attachments.map(({ file }) => file)));
    return lapsed.length;
  }

  /** the vacancy of the position the magistrat holds today, declared or not */
  @Transactional(Propagation.Mandatory)
  async find({ magistratId }: { magistratId: string }): Promise<PositionVacancy> {
    const { positionId } = await this.heldPositions.byHolder({ magistratId });
    const vacancy = await this.db.tx.positionVacancy.findUnique({
      select: { attachments: { select: { fileId: true } } } satisfies Prisma.PositionVacancySelect,
      where: { primaryKey: { magistratId, positionId } },
    });

    return PositionVacancy.from({
      attachmentIds: vacancy?.attachments.map(({ fileId }) => fileId) ?? null,
      magistratId,
      positionId,
    });
  }

  @Transactional(Propagation.Mandatory)
  async persist(vacancy: PositionVacancy): Promise<void> {
    for (const message of vacancy.messages) {
      if (message instanceof PositionVacancyAttachmentRemoved) await this.persistAttachmentRemoved(message);
      else if (message instanceof PositionVacancyAttachmentRenamed)
        await this.persistAttachmentRenamed(message);
      else if (message instanceof PositionVacancyDeclared) await this.persistDeclared(message);
      else if (message instanceof PositionVacancyWithdrawn) await this.persistWithdrawn(message);
      else assertNever(message);
    }
  }

  private async persistAttachmentRemoved(message: PositionVacancyAttachmentRemoved) {
    const { file } = await this.db.tx.positionVacancyAttachment.delete({
      select: { file: { select: { id: true, path: true } } } satisfies Prisma.PositionVacancyAttachmentSelect,
      where: {
        primaryKey: {
          fileId: message.fileId,
          magistratId: message.magistratId,
          positionId: message.positionId,
        },
      },
    });
    this.files.delete([file]);
  }

  private async persistAttachmentRenamed(message: PositionVacancyAttachmentRenamed) {
    await this.files.rename({ id: message.fileId, name: message.name });
  }

  private async persistDeclared(message: PositionVacancyDeclared) {
    const declaration = {
      authorId: message.authorId,
      reason: message.reason,
      reasonDetail: message.reasonDetail,
      startDate: message.startDate.toDate(),
      updatedAt: this.clock.now(),
    };
    await this.db.tx.positionVacancy.upsert({
      create: { ...declaration, magistratId: message.magistratId, positionId: message.positionId },
      update: declaration,
      where: { primaryKey: { magistratId: message.magistratId, positionId: message.positionId } },
    });
    await this.db.tx.positionVacancyAttachment.createMany({
      data: message.fileIds.map((fileId) => ({
        fileId,
        magistratId: message.magistratId,
        positionId: message.positionId,
      })),
    });
  }

  private async persistWithdrawn(message: PositionVacancyWithdrawn) {
    const { attachments } = await this.db.tx.positionVacancy.delete({
      select: {
        attachments: { select: { file: { select: { id: true, path: true } } } },
      } satisfies Prisma.PositionVacancySelect,
      where: { primaryKey: { magistratId: message.magistratId, positionId: message.positionId } },
    });
    this.files.delete(attachments.map(({ file }) => file));
  }
}
