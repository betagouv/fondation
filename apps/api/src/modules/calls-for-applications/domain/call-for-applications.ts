import type { DateOnly } from '../../../utils/date-only';
import { makeId } from '../../../utils/id';

export const CALL_FOR_APPLICATIONS_TYPES = ['GENERAL'] as const;
export type CallForApplicationsType = (typeof CALL_FOR_APPLICATIONS_TYPES)[number];

export const TARGET_JURISDICTION_TYPES = ['COURT_OF_APPEAL', 'JUDICIAL_COURT'] as const;
export type TargetJurisdictionType = (typeof TARGET_JURISDICTION_TYPES)[number];

export const CALL_FOR_APPLICATIONS_STATUSES = ['UNPUBLISHED', 'PUBLISHED'] as const;
export type CallForApplicationsStatus = (typeof CALL_FOR_APPLICATIONS_STATUSES)[number];

const TYPE_LABELS: Record<CallForApplicationsType, string> = { GENERAL: 'Général' };

const TARGET_JURISDICTION_TYPE_LABELS: Record<TargetJurisdictionType, string> = {
  COURT_OF_APPEAL: 'CA',
  JUDICIAL_COURT: 'TJ',
};

const STATUS_LABELS: Record<CallForApplicationsStatus, string> = {
  PUBLISHED: 'Publié',
  UNPUBLISHED: 'Non publié',
};

export function callForApplicationsTypeOf(id: CallForApplicationsType) {
  return { id, label: TYPE_LABELS[id] };
}

export function targetJurisdictionTypeOf(id: TargetJurisdictionType) {
  return { id, label: TARGET_JURISDICTION_TYPE_LABELS[id] };
}

export function callForApplicationsStatusOf(id: CallForApplicationsStatus) {
  return { id, label: STATUS_LABELS[id] };
}

export class DeadlineBeforePublication extends Error {}

export class CallForApplicationsCreated {
  constructor(
    readonly authorId: string,
    readonly comment: string | null,
    readonly createdOn: DateOnly,
    readonly deadline: DateOnly | null,
    readonly id: string,
    readonly publishedOn: DateOnly | null,
    readonly targetJurisdictionType: TargetJurisdictionType,
    readonly type: CallForApplicationsType,
  ) {}
}

export type CallForApplicationsEvent = CallForApplicationsCreated;

export class CallForApplications {
  readonly #messages: CallForApplicationsEvent[] = [];

  private constructor(readonly id: string) {}

  get messages(): readonly CallForApplicationsEvent[] {
    return this.#messages;
  }

  /** createdOn is the day it is saved in Fondation: the agent does not pick it */
  static create(command: {
    authorId: string;
    comment: string | null;
    createdOn: DateOnly;
    deadline: DateOnly | null;
    publishedOn: DateOnly | null;
    targetJurisdictionType: TargetJurisdictionType;
    type: CallForApplicationsType;
  }): CallForApplications {
    const { deadline, publishedOn } = command;
    if (deadline && publishedOn && deadline.toDate() < publishedOn.toDate())
      throw new DeadlineBeforePublication();

    const call = new CallForApplications(makeId());
    call.#messages.push(
      new CallForApplicationsCreated(
        command.authorId,
        command.comment?.trim() || null,
        command.createdOn,
        command.deadline,
        call.id,
        command.publishedOn,
        command.targetJurisdictionType,
        command.type,
      ),
    );

    return call;
  }
}
