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

const TARGET_COURT_TYPES_IN_SENTENCE: Record<TargetCourtType, string> = {
  COURT_OF_APPEAL: "cours d'appel",
  JUDICIAL_COURT: 'tribunaux judiciaires',
};

export function targetCourtTypeInSentenceOf(type: TargetCourtType): string {
  return TARGET_COURT_TYPES_IN_SENTENCE[type];
}

/** what a specific call may adapt for each type of court it targets: the switch and the history read it */
export function guidelinesAdaptationLabelOf(type: TargetCourtType): string {
  return `Adaptation aux lignes directrices de gestion sur la durée d'affectation du poste actuel pour les ${targetCourtTypeInSentenceOf(type)}`;
}

export function targetCourtTypeOptionOf(id: TargetCourtType) {
  return { id, label: TARGET_COURT_TYPE_LABELS[id] };
}

/** the type of a court that a specific call may target (any other court counts as a judicial court) */
export function targetCourtTypeOf(typeJur: string): TargetCourtType {
  return COURT_OF_APPEAL_TYPE_IDS.includes(typeJur) ? 'COURT_OF_APPEAL' : 'JUDICIAL_COURT';
}

export type LolfiCourt = {
  codejur: string;
  libelle: string | null;
  typeJur: string;
  ville_jur: string | null;
};

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

const NAMED_TARGETS_MAX = 3;

/** a few names then the count of the others: "A, B, C et 37 autres" */
function shortList(labels: readonly string[]): string {
  // a single other is named rather than counted: "et 1 autres" would read wrong
  const named = labels.length > NAMED_TARGETS_MAX + 1 ? labels.slice(0, NAMED_TARGETS_MAX) : labels;
  const others = labels.length - named.length;
  return new Intl.ListFormat('fr').format(others > 0 ? [...named, `${others} autres`] : named);
}

export function targetLabelOf(call: {
  targetCourts: readonly { label: string }[];
  targetPositions: readonly CourtOfCassationPosition[];
  type: CallForApplicationsType;
}) {
  switch (targetPickOf(call.type)) {
    case 'COURTS':
      return shortList(call.targetCourts.map(({ label }) => label));
    case 'NONE':
      return "Cours d'appel et tribunaux judiciaires";
    case 'POSITIONS':
      return shortList(
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
  'COURT_OF_APPEAL_GUIDELINES_ADAPTATION',
  'JUDICIAL_COURT_GUIDELINES_ADAPTATION',
  'TARGET_POSITIONS',
  'PUBLISHED_ON',
  'DEADLINE',
  'COMMENT',
] as const;
export type CallForApplicationsField = (typeof CALL_FOR_APPLICATIONS_FIELDS)[number];

/** what an update did to a field: the ones changed before this distinction read as CHANGED */
export const CALL_FOR_APPLICATIONS_FIELD_CHANGES = ['ADDED', 'CHANGED', 'REMOVED'] as const;
export type CallForApplicationsFieldChange = (typeof CALL_FOR_APPLICATIONS_FIELD_CHANGES)[number];

/** the dates or the types before and after a change (none for the other fields) */
type ChangedValues = {
  dateAfter: DateOnly | null;
  dateBefore: DateOnly | null;
  typeAfter: CallForApplicationsType | null;
  typeBefore: CallForApplicationsType | null;
};

/** a field an update changed as the journal keeps it */
export type CallForApplicationsChangedField = ChangedValues & {
  change: CallForApplicationsFieldChange;
  field: CallForApplicationsField;
};

/** the items of a list that an update added and removed */
export type AddedAndRemoved<T> = { added: readonly T[]; removed: readonly T[] };

export function addedAndRemoved<T>(before: readonly T[], after: readonly T[]): AddedAndRemoved<T> {
  return {
    added: after.filter((item) => !before.includes(item)),
    removed: before.filter((item) => !after.includes(item)),
  };
}

export function callForApplicationsTypeOf(id: CallForApplicationsType) {
  return { id, label: TYPE_LABELS[id] };
}

export function callForApplicationsTypeOptionOf(id: CallForApplicationsType) {
  return { scope: TYPE_SCOPES[id], targetPick: targetPickOf(id), type: callForApplicationsTypeOf(id) };
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
  /** the types of court for which a specific call waives the time on the current post the management guidelines ask */
  guidelinesAdaptations: readonly TargetCourtType[];
  publishedOn: DateOnly | null;
  /** the ids of the courts in the referential */
  targetCourts: readonly string[];
  targetPositions: readonly CourtOfCassationPosition[];
  type: CallForApplicationsType;
};

/** a court of the referential with its type and whether a call may target it now */
export type KnownCourt = { targetable: boolean; type: TargetCourtType };

/** the courts of the referential among those requested (a court of another type is left out) */
type KnownCourts = { knownCourts: ReadonlyMap<string, KnownCourt> };

/** once published, only an administrator may still change or delete a call */
export function canChange(call: { status: CallForApplicationsStatus }, actor: { isAdmin: boolean }): boolean {
  return call.status === 'UNPUBLISHED' || actor.isAdmin;
}

/** each court once in a stable order: the order of the ids alone does not change a call */
function uniqueCourts(courts: readonly string[]): string[] {
  return [...new Set(courts)].toSorted();
}

/** the deadline cannot precede the publication and a call keeps only the target of its type (one at least) */
function validated(metadata: Metadata, knownCourts: ReadonlyMap<string, KnownCourt>): Metadata {
  const { deadline, publishedOn } = metadata;
  if (deadline && publishedOn && deadline.toDate() < publishedOn.toDate())
    throw new DeadlineBeforePublication();

  const pick = targetPickOf(metadata.type);
  const targetPositions = pick === 'POSITIONS' ? sortedByHierarchy(metadata.targetPositions) : [];
  if (pick === 'POSITIONS' && targetPositions.length === 0) throw new MissingTargetPosition();

  const targetCourts = pick === 'COURTS' ? uniqueCourts(metadata.targetCourts) : [];
  if (pick === 'COURTS' && targetCourts.length === 0) throw new MissingTargetCourt();
  if (targetCourts.some((court) => !knownCourts.get(court)?.targetable)) throw new UntargetableCourt();

  // an adaptation stands only for a type of court the call targets
  const targetedTypes = targetCourts.map((court) => knownCourts.get(court)?.type);
  const guidelinesAdaptations = TARGET_COURT_TYPES.filter(
    (type) => targetedTypes.includes(type) && metadata.guidelinesAdaptations.includes(type),
  );

  return {
    ...metadata,
    comment: metadata.comment?.trim() || null,
    guidelinesAdaptations,
    targetCourts,
    targetPositions,
  };
}

/** a value filled or emptied (null when it stays the same) */
function valueChangeOf<T>(
  before: T | null,
  after: T | null,
  same: (a: T, b: T) => boolean,
): CallForApplicationsFieldChange | null {
  if (before === null) return after === null ? null : 'ADDED';
  if (after === null) return 'REMOVED';
  return same(before, after) ? null : 'CHANGED';
}

/** what the agent did to a list: only added or only removed items or both (null when it stays the same) */
function listChangeOf<T>({ added, removed }: AddedAndRemoved<T>): CallForApplicationsFieldChange | null {
  if (added.length === 0) return removed.length === 0 ? null : 'REMOVED';
  return removed.length === 0 ? 'ADDED' : 'CHANGED';
}

const NO_VALUE: ChangedValues = { dateAfter: null, dateBefore: null, typeAfter: null, typeBefore: null };

function changedFields(
  before: Metadata,
  after: Metadata,
  targets: { courts: AddedAndRemoved<string>; positions: AddedAndRemoved<CourtOfCassationPosition> },
): CallForApplicationsChangedField[] {
  const isSame = <T>(a: T, b: T) => a === b;
  const adaptation = (type: TargetCourtType) => ({
    ...NO_VALUE,
    change: valueChangeOf(
      before.guidelinesAdaptations.includes(type) || null,
      after.guidelinesAdaptations.includes(type) || null,
      isSame,
    ),
  });
  const dates = (dateBefore: DateOnly | null, dateAfter: DateOnly | null) => ({
    ...NO_VALUE,
    change: valueChangeOf(dateBefore, dateAfter, (a, b) => a.equals(b)),
    dateAfter,
    dateBefore,
  });
  const changes: Record<
    CallForApplicationsField,
    ChangedValues & { change: CallForApplicationsFieldChange | null }
  > = {
    COMMENT: { ...NO_VALUE, change: valueChangeOf(before.comment, after.comment, isSame) },
    COURT_OF_APPEAL_GUIDELINES_ADAPTATION: adaptation('COURT_OF_APPEAL'),
    DEADLINE: dates(before.deadline, after.deadline),
    JUDICIAL_COURT_GUIDELINES_ADAPTATION: adaptation('JUDICIAL_COURT'),
    PUBLISHED_ON: dates(before.publishedOn, after.publishedOn),
    TARGET_COURTS: { ...NO_VALUE, change: listChangeOf(targets.courts) },
    TARGET_POSITIONS: { ...NO_VALUE, change: listChangeOf(targets.positions) },
    TYPE: {
      ...NO_VALUE,
      change: valueChangeOf(before.type, after.type, isSame),
      typeAfter: after.type,
      typeBefore: before.type,
    },
  };
  return CALL_FOR_APPLICATIONS_FIELDS.flatMap((field) => {
    const { change, ...values } = changes[field];
    return change ? [{ ...values, change, field }] : [];
  });
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
    /** the courts added and removed */
    readonly courts: AddedAndRemoved<string>,
    readonly fields: readonly CallForApplicationsChangedField[],
    readonly id: string,
    readonly metadata: Metadata,
    /** the positions of the Cour de cassation added and removed */
    readonly positions: AddedAndRemoved<CourtOfCassationPosition>,
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
      guidelinesAdaptations: TARGET_COURT_TYPES.filter((type) =>
        metadata.guidelinesAdaptations.includes(type),
      ),
      targetCourts: uniqueCourts(metadata.targetCourts),
      targetPositions: sortedByHierarchy(metadata.targetPositions),
    });
  }

  /** createdOn is the day it is saved in Fondation: the agent does not pick it */
  static create(
    command: Metadata & KnownCourts & { authorId: string; createdOn: DateOnly },
  ): CallForApplications {
    const { authorId, createdOn, knownCourts, ...metadata } = command;
    const call = new CallForApplications(makeId(), 'UNPUBLISHED', validated(metadata, knownCourts));
    call.#messages.push(new CallForApplicationsCreated(authorId, createdOn, call.id, call.metadata));

    return call;
  }

  /** every field is replaced: only the ones that changed go to the history (nothing when none did) */
  update(command: Metadata & KnownCourts & { actor: { id: string; isAdmin: boolean } }): void {
    const { actor, knownCourts, ...requested } = command;
    if (!canChange({ status: this.status }, actor)) throw new PublishedCallLocked();

    // a court removed since the call targeted it stays allowed
    const allowed = new Map(
      [...knownCourts].map(([id, court]) => [
        id,
        this.metadata.targetCourts.includes(id) ? { ...court, targetable: true } : court,
      ]),
    );
    const metadata = validated(requested, allowed);
    const courts = addedAndRemoved(this.metadata.targetCourts, metadata.targetCourts);
    const positions = addedAndRemoved(this.metadata.targetPositions, metadata.targetPositions);
    const fields = changedFields(this.metadata, metadata, { courts, positions });
    if (fields.length > 0)
      this.#messages.push(
        new CallForApplicationsUpdated(actor.id, courts, fields, this.id, metadata, positions),
      );
  }

  delete(actor: { id: string; isAdmin: boolean }): void {
    if (!canChange({ status: this.status }, actor)) throw new PublishedCallLocked();
    this.#messages.push(new CallForApplicationsDeleted(actor.id, this.id));
  }
}
