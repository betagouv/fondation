import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { assertNever } from '../../../utils/assert-never';
import { Clock } from '../../framework/clock';
import { Db } from '../../framework/database';
import { Survey, SurveyAnswered } from '../domain/survey';

@Injectable()
export class SurveyRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  @Transactional(Propagation.Mandatory)
  async persist(survey: Survey): Promise<void> {
    for (const message of survey.messages) {
      if (message instanceof SurveyAnswered) await this.persistSurveyAnswered(message);
      else assertNever(message);
    }
  }

  private persistSurveyAnswered(message: SurveyAnswered) {
    const { member, secretariat, ...common } = message.answers;

    return this.db.tx.survey.create({
      data: {
        ...common,
        answeredAt: this.clock.now(),
        member: member ? { create: member } : undefined,
        secretariat: secretariat ? { create: secretariat } : undefined,
        userId: message.userId,
      },
    });
  }
}
