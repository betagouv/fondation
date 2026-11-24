import type { DateOnly } from '../../../utils/date-only';
import { makeId } from '../../../utils/id';

export const CALL_FOR_APPLICATIONS_TYPES = ['GENERAL'] as const;
export type CallForApplicationsType = (typeof CALL_FOR_APPLICATIONS_TYPES)[number];

export const CALL_FOR_APPLICATIONS_STATUSES = ['UNPUBLISHED', 'PUBLISHED'] as const;
export type CallForApplicationsStatus = (typeof CALL_FOR_APPLICATIONS_STATUSES)[number];

const TYPE_LABELS: Record<CallForApplicationsType, string> = { GENERAL: 'Général' };

/** what each type of call targets: a general call always targets every position of the CA and the TJ */
const TYPE_SCOPES: Record<CallForApplicationsType, string> = {
  GENERAL: 'Vise tous les postes de CA et de TJ',
};

const STATUS_LABELS: Record<CallForApplicationsStatus, string> = {
  PUBLISHED: 'Publié',
  UNPUBLISHED: 'Non publié',
};

export const CALL_FOR_APPLICATIONS_ACTIONS = ['CREATED', 'UPDATED', 'DELETED'] as const;
export type CallForApplicationsAction = (typeof CALL_FOR_APPLICATIONS_ACTIONS)[number];

/** in the order of the form: the history lists them so */
export const CALL_FOR_APPLICATIONS_FIELDS = ['TYPE', 'PUBLISHED_ON', 'DEADLINE', 'COMMENT'] as const;
export type CallForApplicationsField = (typeof CALL_FOR_APPLICATIONS_FIELDS)[number];

/** with their article: the history reads "a modifié la date limite et le commentaire" */
const FIELD_LABELS: Record<CallForApplicationsField, string> = {
  COMMENT: 'le commentaire',
  DEADLINE: 'la date limite',
  PUBLISHED_ON: 'la date de publication',
  TYPE: "le type d'appel",
};

export function callForApplicationsFieldOf(id: CallForApplicationsField) {
  return { id, label: FIELD_LABELS[id] };
}

export function callForApplicationsTypeOf(id: CallForApplicationsType) {
  return { id, label: TYPE_LABELS[id] };
}

export function callForApplicationsTypeScopeOf(id: CallForApplicationsType) {
  return { ...callForApplicationsTypeOf(id), scope: TYPE_SCOPES[id] };
}

export function callForApplicationsStatusOf(id: CallForApplicationsStatus) {
  return { id, label: STATUS_LABELS[id] };
}

export class DeadlineBeforePublication extends Error {}
export class PublishedCallLocked extends Error {}

type Metadata = {
  comment: string | null;
  deadline: DateOnly | null;
  publishedOn: DateOnly | null;
  type: CallForApplicationsType;
};

/** once published, only an administrator may still change or delete a call */
export function canChange(call: { status: CallForApplicationsStatus }, actor: { isAdmin: boolean }): boolean {
  return call.status === 'UNPUBLISHED' || actor.isAdmin;
}

/** the deadline closes the period that the publication opens */
function validated(metadata: Metadata): Metadata {
  const { deadline, publishedOn } = metadata;
  if (deadline && publishedOn && deadline.toDate() < publishedOn.toDate())
    throw new DeadlineBeforePublication();

  return { ...metadata, comment: metadata.comment?.trim() || null };
}

function isSameDate(a: DateOnly | null, b: DateOnly | null): boolean {
  return a === null || b === null ? a === b : a.equals(b);
}

function changedFields(before: Metadata, after: Metadata): CallForApplicationsField[] {
  const changed: Record<CallForApplicationsField, boolean> = {
    COMMENT: before.comment !== after.comment,
    DEADLINE: !isSameDate(before.deadline, after.deadline),
    PUBLISHED_ON: !isSameDate(before.publishedOn, after.publishedOn),
    TYPE: before.type !== after.type,
  };
  return CALL_FOR_APPLICATIONS_FIELDS.filter((field) => changed[field]);
}

export class CallForApplicationsCreated {
  constructor(
    readonly authorId: string,
    readonly createdOn: DateOnly,
    readonly id: string,
    readonly metadata: Metadata,
  ) {}
}

export class CallForApplicationsUpdated {
  constructor(
    readonly authorId: string,
    readonly fields: readonly CallForApplicationsField[],
    readonly id: string,
    readonly metadata: Metadata,
  ) {}
}

export class CallForApplicationsDeleted {
  constructor(
    readonly authorId: string,
    readonly id: string,
  ) {}
}

export type CallForApplicationsEvent =
  | CallForApplicationsCreated
  | CallForApplicationsDeleted
  | CallForApplicationsUpdated;

export class CallForApplications {
  readonly #messages: CallForApplicationsEvent[] = [];

  private constructor(
    readonly id: string,
    private readonly status: CallForApplicationsStatus,
    private readonly metadata: Metadata,
  ) {}

  get messages(): readonly CallForApplicationsEvent[] {
    return this.#messages;
  }

  static from(props: Metadata & { id: string; status: CallForApplicationsStatus }): CallForApplications {
    const { id, status, ...metadata } = props;
    return new CallForApplications(id, status, metadata);
  }

  /** createdOn is the day it is saved in Fondation: the agent does not pick it */
  static create(command: Metadata & { authorId: string; createdOn: DateOnly }): CallForApplications {
    const { authorId, createdOn, ...metadata } = command;
    const call = new CallForApplications(makeId(), 'UNPUBLISHED', validated(metadata));
    call.#messages.push(new CallForApplicationsCreated(authorId, createdOn, call.id, call.metadata));

    return call;
  }

  /** every field is replaced: only the ones that changed go to the history, and nothing when none did */
  update(command: Metadata & { actor: { id: string; isAdmin: boolean } }): void {
    const { actor, ...requested } = command;
    if (!canChange({ status: this.status }, actor)) throw new PublishedCallLocked();

    const metadata = validated(requested);
    const fields = changedFields(this.metadata, metadata);
    if (fields.length > 0)
      this.#messages.push(new CallForApplicationsUpdated(actor.id, fields, this.id, metadata));
  }

  delete(actor: { id: string; isAdmin: boolean }): void {
    if (!canChange({ status: this.status }, actor)) throw new PublishedCallLocked();
    this.#messages.push(new CallForApplicationsDeleted(actor.id, this.id));
  }
}
