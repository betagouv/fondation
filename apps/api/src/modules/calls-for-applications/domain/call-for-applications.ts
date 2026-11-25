import type { DateOnly } from '../../../utils/date-only';
import { makeId } from '../../../utils/id';
import {
  COURT_OF_CASSATION_POSITIONS,
  type CourtOfCassationPosition,
} from '../../shared/court-of-cassation-position.enum';

export const CALL_FOR_APPLICATIONS_TYPES = ['GENERAL', 'CCASS'] as const;
export type CallForApplicationsType = (typeof CALL_FOR_APPLICATIONS_TYPES)[number];

export const CALL_FOR_APPLICATIONS_STATUSES = ['UNPUBLISHED', 'PUBLISHED'] as const;
export type CallForApplicationsStatus = (typeof CALL_FOR_APPLICATIONS_STATUSES)[number];

const TYPE_LABELS: Record<CallForApplicationsType, string> = {
  CCASS: 'Cour de cassation',
  GENERAL: 'Général',
};

/** what each type of call targets: a general call always targets every position of the CA and the TJ */
const TYPE_SCOPES: Record<CallForApplicationsType, string> = {
  CCASS: 'Vise les postes de la Cour de cassation choisis',
  GENERAL: 'Vise tous les postes de CA et de TJ',
};

/** only a call for the Cour de cassation targets the positions picked */
export function targetsPositions(type: CallForApplicationsType): boolean {
  return type === 'CCASS';
}

/** singular labels since the agent picks one position at a time (the veille names its tabs in the plural) */
const POSITION_LABELS: Record<CourtOfCassationPosition, string> = {
  AUDITOR_FIRST_GRADE: 'Auditeur 1er grade',
  AUDITOR_SECOND_GRADE: 'Auditeur 2nd grade',
  CHAMBER_PRESIDENT: 'Président de chambre',
  COUNSELLOR: 'Conseiller',
  FIRST_PRESIDENT: 'Premier président',
  REFERENDARY_COUNSELLOR: 'Conseiller référendaire',
};

/** each position once from the highest to the lowest since the base returns them in any order */
export function sortedByHierarchy(
  positions: readonly CourtOfCassationPosition[],
): CourtOfCassationPosition[] {
  return COURT_OF_CASSATION_POSITIONS.filter((position) => positions.includes(position));
}

export function targetPositionOf(id: CourtOfCassationPosition) {
  return { id, label: POSITION_LABELS[id] };
}

export function targetLabelOf(call: {
  targetPositions: readonly CourtOfCassationPosition[];
  type: CallForApplicationsType;
}) {
  return targetsPositions(call.type)
    ? new Intl.ListFormat('fr').format(call.targetPositions.map((position) => POSITION_LABELS[position]))
    : 'CA et TJ';
}

const STATUS_LABELS: Record<CallForApplicationsStatus, string> = {
  PUBLISHED: 'Publié',
  UNPUBLISHED: 'Non publié',
};

export const CALL_FOR_APPLICATIONS_ACTIONS = ['CREATED', 'UPDATED', 'DELETED'] as const;
export type CallForApplicationsAction = (typeof CALL_FOR_APPLICATIONS_ACTIONS)[number];

/** in the order of the form: the history lists them so */
export const CALL_FOR_APPLICATIONS_FIELDS = [
  'TYPE',
  'TARGET_POSITIONS',
  'PUBLISHED_ON',
  'DEADLINE',
  'COMMENT',
] as const;
export type CallForApplicationsField = (typeof CALL_FOR_APPLICATIONS_FIELDS)[number];

/** with their article: the history reads "a modifié la date limite et le commentaire" */
const FIELD_LABELS: Record<CallForApplicationsField, string> = {
  COMMENT: 'le commentaire',
  DEADLINE: 'la date limite',
  PUBLISHED_ON: 'la date de publication',
  TARGET_POSITIONS: 'les postes cibles',
  TYPE: "le type d'appel",
};

export function callForApplicationsFieldOf(id: CallForApplicationsField) {
  return { id, label: FIELD_LABELS[id] };
}

export function callForApplicationsTypeOf(id: CallForApplicationsType) {
  return { id, label: TYPE_LABELS[id] };
}

export function callForApplicationsTypeOptionOf(id: CallForApplicationsType) {
  return {
    ...callForApplicationsTypeOf(id),
    scope: TYPE_SCOPES[id],
    targetPositionsRequired: targetsPositions(id),
  };
}

export function callForApplicationsStatusOf(id: CallForApplicationsStatus) {
  return { id, label: STATUS_LABELS[id] };
}

export class DeadlineBeforePublication extends Error {}
export class MissingTargetPosition extends Error {}
export class PublishedCallLocked extends Error {}

type Metadata = {
  comment: string | null;
  deadline: DateOnly | null;
  publishedOn: DateOnly | null;
  targetPositions: readonly CourtOfCassationPosition[];
  type: CallForApplicationsType;
};

/** once published, only an administrator may still change or delete a call */
export function canChange(call: { status: CallForApplicationsStatus }, actor: { isAdmin: boolean }): boolean {
  return call.status === 'UNPUBLISHED' || actor.isAdmin;
}

/** the deadline cannot precede the publication and a call targeting positions needs one at least */
function validated(metadata: Metadata): Metadata {
  const { deadline, publishedOn } = metadata;
  if (deadline && publishedOn && deadline.toDate() < publishedOn.toDate())
    throw new DeadlineBeforePublication();

  const targetPositions = targetsPositions(metadata.type) ? sortedByHierarchy(metadata.targetPositions) : [];
  if (targetsPositions(metadata.type) && targetPositions.length === 0) throw new MissingTargetPosition();

  return { ...metadata, comment: metadata.comment?.trim() || null, targetPositions };
}

function isSameDate(a: DateOnly | null, b: DateOnly | null): boolean {
  return a === null || b === null ? a === b : a.equals(b);
}

function changedFields(before: Metadata, after: Metadata): CallForApplicationsField[] {
  const changed: Record<CallForApplicationsField, boolean> = {
    COMMENT: before.comment !== after.comment,
    DEADLINE: !isSameDate(before.deadline, after.deadline),
    PUBLISHED_ON: !isSameDate(before.publishedOn, after.publishedOn),
    TARGET_POSITIONS: before.targetPositions.join() !== after.targetPositions.join(),
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
    return new CallForApplications(id, status, {
      ...metadata,
      targetPositions: sortedByHierarchy(metadata.targetPositions),
    });
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
