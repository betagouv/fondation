import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { assertNever } from '../../../utils/assert-never';
import { Clock } from '../../framework/clock';
import { Db } from '../../framework/database';
import { CallForApplications, CallForApplicationsCreated } from '../domain/call-for-applications';

@Injectable()
export class CallForApplicationsRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  @Transactional(Propagation.Mandatory)
  async persist(call: CallForApplications): Promise<void> {
    for (const message of call.messages) {
      if (message instanceof CallForApplicationsCreated) await this.persistCreated(message);
      else assertNever(message);
    }
  }

  private async persistCreated(message: CallForApplicationsCreated) {
    await this.db.tx.callForApplications.create({
      data: {
        authorId: message.authorId,
        comment: message.comment,
        createdOn: message.createdOn.toDate(),
        deadline: message.deadline?.toDate() ?? null,
        id: message.id,
        publishedOn: message.publishedOn?.toDate() ?? null,
        targetJurisdictionType: message.targetJurisdictionType,
        type: message.type,
        updatedAt: this.clock.now(),
      },
    });
  }
}
