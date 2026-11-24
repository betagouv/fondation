import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { DateOnly } from '../../utils/date-only';
import { Clock } from '../framework/clock';
import { Pagination } from '../framework/pagination';
import type { Sortable } from '../framework/sorting';

import {
  CallForApplications,
  type CallForApplicationsStatus,
  type CallForApplicationsType,
  type TargetJurisdictionType,
} from './domain/call-for-applications';
import type { CallForApplicationsPeriod } from './domain/call-for-applications-period';
import type { CallForApplicationsSortableColumn } from './domain/call-for-applications-sorting';
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

  @Transactional()
  async deleteCallForApplications(command: {
    actor: { id: string; isAdmin: boolean };
    id: string;
  }): Promise<void> {
    const call = await this.calls.find(command);
    call.delete(command.actor);
    await this.calls.persist(call);
  }

  findCallForApplicationsForm(): FoundCallForApplicationsFormDto {
    return this.findCallForApplicationsFormQuery.handle();
  }

  listCallsForApplications(query: {
    actor: { isAdmin: boolean };
    pagination: Pagination;
    period: CallForApplicationsPeriod;
    sorting: Sortable<CallForApplicationsSortableColumn>;
    statuses: readonly CallForApplicationsStatus[];
    targetJurisdictionTypes: readonly TargetJurisdictionType[];
    years: readonly number[];
  }): Promise<ListedCallsForApplicationsDto> {
    return this.listCallsForApplicationsQuery.handle(query);
  }

  @Transactional()
  async updateCallForApplications(command: {
    actor: { id: string; isAdmin: boolean };
    comment: string | null;
    deadline: DateOnly | null;
    id: string;
    publishedOn: DateOnly | null;
    targetJurisdictionType: TargetJurisdictionType;
    type: CallForApplicationsType;
  }): Promise<void> {
    const { id, ...update } = command;
    const call = await this.calls.find({ id });
    call.update(update);
    await this.calls.persist(call);
  }
}
