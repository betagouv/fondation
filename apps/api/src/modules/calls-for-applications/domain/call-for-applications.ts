import type { DateOnly } from '../../../utils/date-only';
import { makeId } from '../../../utils/id';
import { COURT_OF_APPEAL_TYPE_IDS } from '../../shared/court';
import {
  COURT_OF_CASSATION_POSITION_TITLES,
  COURT_OF_CASSATION_POSITIONS,
  type CourtOfCassationPosition,
} from '../../shared/court-of-cassation-position.enum';

export const CALL_FOR_APPLICATIONS_TYPES = ['GENERAL', 'SPECIFIC', 'CCASS'] as const;
export type CallForApplicationsType = (typeof CALL_FOR_APPLICATIONS_TYPES)[number];

export const CALL_FOR_APPLICATIONS_STATUSES = ['UNPUBLISHED', 'PUBLISHED'] as const;
export type CallForApplicationsStatus = (typeof CALL_FOR_APPLICATIONS_STATUSES)[number];

const TYPE_LABELS: Record<CallForApplicationsType, string> = {
  CCASS: 'Cour de cassation',
  GENERAL: 'Général',
  SPECIFIC: 'Spécifique',
};

/** what each type of call targets: a general call always targets every position of the courts of appeal and the judicial courts */
const TYPE_SCOPES: Record<CallForApplicationsType, string> = {
  CCASS: 'Vise les postes de la Cour de cassation choisis',
  GENERAL: "Vise tous les postes des cours d'appel et des tribunaux judiciaires",
  SPECIFIC: 'Vise la présidence des juridictions choisies',
};

/** what the agent picks as the target of a call */
export const TARGET_PICKS = ['NONE', 'COURTS', 'POSITIONS'] as const;
export type TargetPick = (typeof TARGET_PICKS)[number];

const TYPE_TARGET_PICKS: Record<CallForApplicationsType, TargetPick> = {
  CCASS: 'POSITIONS',
  GENERAL: 'NONE',
  SPECIFIC: 'COURTS',
};

export function targetPickOf(type: CallForApplicationsType): TargetPick {
  return TYPE_TARGET_PICKS[type];
}

/** a specific call targets the head of a court of appeal or of a judicial court */
export const TARGET_COURT_TYPES = ['COURT_OF_APPEAL', 'JUDICIAL_COURT'] as const;
export type TargetCourtType = (typeof TARGET_COURT_TYPES)[number];

const TARGET_COURT_TYPE_LABELS: Record<TargetCourtType, string> = {
  COURT_OF_APPEAL: "Cours d'appel",
  JUDICIAL_COURT: 'Tribunaux judiciaires',
};

export function targetCourtTypeOptionOf(id: TargetCourtType) {
  return { id, label: TARGET_COURT_TYPE_LABELS[id] };
}

/** the type of a court that a specific call may target (any other court counts as a judicial court) */
export function targetCourtTypeOf(typeJur: string): TargetCourtType {
  return COURT_OF_APPEAL_TYPE_IDS.includes(typeJur) ? 'COURT_OF_APPEAL' : 'JUDICIAL_COURT';
}

type LolfiCourt = { codejur: string; libelle: string | null; typeJur: string; ville_jur: string | null };

/** the courts of appeal first then the judicial courts with each group by city (then by id) */
export function sortedCourts<T extends LolfiCourt>(courts: readonly T[]): T[] {
  const rank = (court: T) => TARGET_COURT_TYPES.indexOf(targetCourtTypeOf(court.typeJur));
  const city = (court: T) => court.ville_jur ?? court.codejur;
  return courts.toSorted(
    (a, b) => rank(a) - rank(b) || city(a).localeCompare(city(b), 'fr') || a.codejur.localeCompare(b.codejur),
  );
}

export function targetCourtOf(court: LolfiCourt) {
  return { id: court.codejur, label: court.libelle ?? court.codejur, type: targetCourtTypeOf(court.typeJur) };
}

/** each position once from the highest to the lowest since the base returns them in any order */
export function sortedByHierarchy(
  positions: readonly CourtOfCassationPosition[],
): CourtOfCassationPosition[] {
  return COURT_OF_CASSATION_POSITIONS.filter((position) => positions.includes(position));
}

export function targetPositionOf(id: CourtOfCassationPosition) {
  return { id, label: COURT_OF_CASSATION_POSITION_TITLES[id].man };
}

export function targetLabelOf(call: {
  targetCourts: readonly { label: string }[];
  targetPositions: readonly CourtOfCassationPosition[];
  type: CallForApplicationsType;
}) {
  const list = new Intl.ListFormat('fr');
  switch (targetPickOf(call.type)) {
    case 'COURTS':
      return list.format(call.targetCourts.map(({ label }) => label));
    case 'NONE':
      return "Cours d'appel et tribunaux judiciaires";
    case 'POSITIONS':
      return list.format(
        call.targetPositions.map((position) => COURT_OF_CASSATION_POSITION_TITLES[position].man),
      );
  }
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
  'TARGET_COURTS',
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
  TARGET_COURTS: 'les juridictions cibles',
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
    targetPick: targetPickOf(id),
  };
}

export function callForApplicationsStatusOf(id: CallForApplicationsStatus) {
  return { id, label: STATUS_LABELS[id] };
}

export class DeadlineBeforePublication extends Error {}
export class MissingTargetCourt extends Error {}
export class MissingTargetPosition extends Error {}
export class PublishedCallLocked extends Error {}
export class UntargetableCourt extends Error {}

type Metadata = {
  comment: string | null;
  deadline: DateOnly | null;
  publishedOn: DateOnly | null;
  /** the ids of the courts in the referential */
  targetCourts: readonly string[];
  targetPositions: readonly CourtOfCassationPosition[];
  type: CallForApplicationsType;
};

/** the courts a call may target: the targetable ones of the referential among those requested */
type TargetableCourts = { targetableCourts: ReadonlySet<string> };

/** once published, only an administrator may still change or delete a call */
export function canChange(call: { status: CallForApplicationsStatus }, actor: { isAdmin: boolean }): boolean {
  return call.status === 'UNPUBLISHED' || actor.isAdmin;
}

/** each court once in a stable order: the order of the ids alone does not change a call */
function uniqueCourts(courts: readonly string[]): string[] {
  return [...new Set(courts)].toSorted();
}

/** the deadline cannot precede the publication and a call keeps only the target of its type (one at least) */
function validated(metadata: Metadata, targetableCourts: ReadonlySet<string>): Metadata {
  const { deadline, publishedOn } = metadata;
  if (deadline && publishedOn && deadline.toDate() < publishedOn.toDate())
    throw new DeadlineBeforePublication();

  const pick = targetPickOf(metadata.type);
  const targetPositions = pick === 'POSITIONS' ? sortedByHierarchy(metadata.targetPositions) : [];
  if (pick === 'POSITIONS' && targetPositions.length === 0) throw new MissingTargetPosition();

  const targetCourts = pick === 'COURTS' ? uniqueCourts(metadata.targetCourts) : [];
  if (pick === 'COURTS' && targetCourts.length === 0) throw new MissingTargetCourt();
  if (targetCourts.some((court) => !targetableCourts.has(court))) throw new UntargetableCourt();

  return { ...metadata, comment: metadata.comment?.trim() || null, targetCourts, targetPositions };
}

function isSameDate(a: DateOnly | null, b: DateOnly | null): boolean {
  return a === null || b === null ? a === b : a.equals(b);
}

function changedFields(before: Metadata, after: Metadata): CallForApplicationsField[] {
  const changed: Record<CallForApplicationsField, boolean> = {
    COMMENT: before.comment !== after.comment,
    DEADLINE: !isSameDate(before.deadline, after.deadline),
    PUBLISHED_ON: !isSameDate(before.publishedOn, after.publishedOn),
    TARGET_COURTS: before.targetCourts.join() !== after.targetCourts.join(),
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
      targetCourts: uniqueCourts(metadata.targetCourts),
      targetPositions: sortedByHierarchy(metadata.targetPositions),
    });
  }

  /** createdOn is the day it is saved in Fondation: the agent does not pick it */
  static create(
    command: Metadata & TargetableCourts & { authorId: string; createdOn: DateOnly },
  ): CallForApplications {
    const { authorId, createdOn, targetableCourts, ...metadata } = command;
    const call = new CallForApplications(makeId(), 'UNPUBLISHED', validated(metadata, targetableCourts));
    call.#messages.push(new CallForApplicationsCreated(authorId, createdOn, call.id, call.metadata));

    return call;
  }

  /** every field is replaced: only the ones that changed go to the history (nothing when none did) */
  update(command: Metadata & TargetableCourts & { actor: { id: string; isAdmin: boolean } }): void {
    const { actor, targetableCourts, ...requested } = command;
    if (!canChange({ status: this.status }, actor)) throw new PublishedCallLocked();

    // a court removed since the call targeted it stays allowed
    const metadata = validated(requested, new Set([...targetableCourts, ...this.metadata.targetCourts]));
    const fields = changedFields(this.metadata, metadata);
    if (fields.length > 0)
      this.#messages.push(new CallForApplicationsUpdated(actor.id, fields, this.id, metadata));
  }

  delete(actor: { id: string; isAdmin: boolean }): void {
    if (!canChange({ status: this.status }, actor)) throw new PublishedCallLocked();
    this.#messages.push(new CallForApplicationsDeleted(actor.id, this.id));
  }
}
