import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { DateOnly } from '../../utils/date-only';
import { Clock } from '../framework/clock';
import { Pagination } from '../framework/pagination';

import {
  CallForApplications,
  type CallForApplicationsType,
  type TargetJurisdictionType,
} from './domain/call-for-applications';
import type { CreatedCallForApplicationsDto } from './infrastructure/call-for-applications.dto';
import { CallForApplicationsRepository } from './infrastructure/call-for-applications.repository';
import {
  FindCallForApplicationsFormQuery,
  FoundCallForApplicationsFormDto,
} from './infrastructure/queries/find-call-for-applications-form.query';
import {
  ListCallsForApplicationsQuery,
  ListedCallsForApplicationsDto,
} from './infrastructure/queries/list-calls-for-applications.query';

@Injectable()
export class CallsForApplicationsService {
  constructor(
    private readonly calls: CallForApplicationsRepository,
    private readonly clock: Clock,
    private readonly findCallForApplicationsFormQuery: FindCallForApplicationsFormQuery,
    private readonly listCallsForApplicationsQuery: ListCallsForApplicationsQuery,
  ) {}

  @Transactional()
  async createCallForApplications(command: {
    authorId: string;
    comment: string | null;
    deadline: DateOnly | null;
    publishedOn: DateOnly | null;
    targetJurisdictionType: TargetJurisdictionType;
    type: CallForApplicationsType;
  }): Promise<CreatedCallForApplicationsDto> {
    const call = CallForApplications.create({
      ...command,
      createdOn: DateOnly.fromInstantInParis(this.clock.now()),
    });
    await this.calls.persist(call);

    return { id: call.id };
  }

  findCallForApplicationsForm(): FoundCallForApplicationsFormDto {
    return this.findCallForApplicationsFormQuery.handle();
  }

  listCallsForApplications(query: { pagination: Pagination }): Promise<ListedCallsForApplicationsDto> {
    return this.listCallsForApplicationsQuery.handle(query);
  }
}
