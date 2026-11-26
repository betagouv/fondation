import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { assertNever } from '../../../utils/assert-never';
import { DateOnly } from '../../../utils/date-only';
import { makeId } from '../../../utils/id';
import { Clock } from '../../framework/clock';
import { Db } from '../../framework/database';
import {
  type AddedAndRemoved,
  CallForApplications,
  type CallForApplicationsAction,
  CallForApplicationsCreated,
  CallForApplicationsDeleted,
  CallForApplicationsUpdated,
} from '../domain/call-for-applications';

@Injectable()
export class CallForApplicationsRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  @Transactional(Propagation.Mandatory)
  async find({ id }: { id: string }): Promise<CallForApplications> {
    const call = await this.db.tx.callForApplications.findUnique({
      select: {
        comment: true,
        deadline: true,
        id: true,
        publishedOn: true,
        status: true,
        targetCourts: { select: { courtId: true } },
        targetPositions: { select: { position: true } },
        type: true,
      } satisfies Prisma.CallForApplicationsSelect,
      where: { id },
    });
    if (!call) throw new NotFoundException();

    return CallForApplications.from({
      ...call,
      deadline: DateOnly.fromOptionalUtcDate(call.deadline),
      publishedOn: DateOnly.fromOptionalUtcDate(call.publishedOn),
      targetCourts: call.targetCourts.map(({ courtId }) => courtId),
      targetPositions: call.targetPositions.map(({ position }) => position),
    });
  }

  @Transactional(Propagation.Mandatory)
  async persist(call: CallForApplications): Promise<void> {
    for (const message of call.messages) {
      if (message instanceof CallForApplicationsCreated) await this.persistCreated(message);
      else if (message instanceof CallForApplicationsDeleted) await this.persistDeleted(message);
      else if (message instanceof CallForApplicationsUpdated) await this.persistUpdated(message);
      else assertNever(message);
    }
  }

  private async persistCreated(message: CallForApplicationsCreated) {
    await this.db.tx.callForApplications.create({
      data: {
        ...columnsOf(message.metadata),
        createdOn: message.createdOn.toDate(),
        id: message.id,
        targetCourts: { create: message.metadata.targetCourts.map((courtId) => ({ courtId })) },
        targetPositions: { create: message.metadata.targetPositions.map((position) => ({ position })) },
      },
    });
    await this.journal('CREATED', message);
  }

  private async persistDeleted(message: CallForApplicationsDeleted) {
    // another deletion may have gone first since the call was read
    const { count } = await this.db.tx.callForApplications.deleteMany({ where: { id: message.id } });
    if (count === 0) throw new NotFoundException();

    await this.journal('DELETED', message);
  }

  private async persistUpdated(message: CallForApplicationsUpdated) {
    // a deletion may have gone first since the call was read
    const { count } = await this.db.tx.callForApplications.updateMany({
      data: columnsOf(message.metadata),
      where: { id: message.id },
    });
    if (count === 0) throw new NotFoundException();

    await this.db.tx.callForApplicationsTargetCourt.deleteMany({ where: { callId: message.id } });
    await this.db.tx.callForApplicationsTargetCourt.createMany({
      data: message.metadata.targetCourts.map((courtId) => ({ callId: message.id, courtId })),
    });
    await this.db.tx.callForApplicationsTargetPosition.deleteMany({ where: { callId: message.id } });
    await this.db.tx.callForApplicationsTargetPosition.createMany({
      data: message.metadata.targetPositions.map((position) => ({ callId: message.id, position })),
    });
    await this.journal('UPDATED', message, {
      changedCourts: {
        create: itemChangesOf(message.courts).map(({ fieldChange, item }) => ({
          courtId: item,
          fieldChange,
        })),
      },
      changedPositions: {
        create: itemChangesOf(message.positions).map(({ fieldChange, item }) => ({
          fieldChange,
          position: item,
        })),
      },
      fields: {
        create: message.fields.map(({ change, dateAfter, dateBefore, field, typeAfter, typeBefore }) => ({
          dateAfter: dateAfter?.toDate() ?? null,
          dateBefore: dateBefore?.toDate() ?? null,
          field,
          fieldChange: change,
          typeAfter,
          typeBefore,
        })),
      },
    });
  }

  private async journal(
    action: CallForApplicationsAction,
    message: { authorId: string; id: string },
    details: Pick<
      Prisma.CallForApplicationsChangeCreateInput,
      'changedCourts' | 'changedPositions' | 'fields'
    > = {},
  ) {
    await this.db.tx.callForApplicationsChange.create({
      data: {
        ...details,
        action,
        at: this.clock.now(),
        authorId: message.authorId,
        callId: message.id,
        id: makeId(),
      },
    });
  }
}

function itemChangesOf<T>(items: AddedAndRemoved<T>) {
  return [
    ...items.added.map((item) => ({ fieldChange: 'ADDED' as const, item })),
    ...items.removed.map((item) => ({ fieldChange: 'REMOVED' as const, item })),
  ];
}

function columnsOf(metadata: CallForApplicationsCreated['metadata']) {
  return {
    comment: metadata.comment,
    deadline: metadata.deadline?.toDate() ?? null,
    publishedOn: metadata.publishedOn?.toDate() ?? null,
    type: metadata.type,
  };
}
