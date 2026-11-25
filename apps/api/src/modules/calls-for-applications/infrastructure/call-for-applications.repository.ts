import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { assertNever } from '../../../utils/assert-never';
import { DateOnly } from '../../../utils/date-only';
import { makeId } from '../../../utils/id';
import { Clock } from '../../framework/clock';
import { Db } from '../../framework/database';
import {
  type CallForApplicationsAction,
  CallForApplications,
  CallForApplicationsCreated,
  CallForApplicationsDeleted,
  type CallForApplicationsField,
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

    await this.db.tx.callForApplicationsTargetPosition.deleteMany({ where: { callId: message.id } });
    await this.db.tx.callForApplicationsTargetPosition.createMany({
      data: message.metadata.targetPositions.map((position) => ({ callId: message.id, position })),
    });
    await this.journal('UPDATED', message, message.fields);
  }

  private async journal(
    action: CallForApplicationsAction,
    message: { authorId: string; id: string },
    fields: readonly CallForApplicationsField[] = [],
  ) {
    await this.db.tx.callForApplicationsChange.create({
      data: {
        action,
        at: this.clock.now(),
        authorId: message.authorId,
        callId: message.id,
        fields: { create: fields.map((field) => ({ field })) },
        id: makeId(),
      },
    });
  }
}

function columnsOf(metadata: CallForApplicationsCreated['metadata']) {
  return {
    comment: metadata.comment,
    deadline: metadata.deadline?.toDate() ?? null,
    publishedOn: metadata.publishedOn?.toDate() ?? null,
    type: metadata.type,
  };
}
