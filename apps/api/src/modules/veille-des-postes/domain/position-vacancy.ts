import type { DateOnly } from '../../../utils/date-only';

/** in the order of the specification: the form follows it */
export const VACANCY_REASONS = [
  'DISCHARGE',
  'DEATH',
  'DISCIPLINARY_DISMISSAL',
  'RETIREMENT',
  'STRIKING_OFF',
  'OTHER',
] as const;
export type VacancyReason = (typeof VACANCY_REASONS)[number];

/** shown whole in the side panel and on hover in the tables */
export const REASON_DETAIL_MAX_LENGTH = 300;

const REASON_LABELS: Record<VacancyReason, string> = {
  DEATH: 'Décès',
  DISCHARGE: 'Décharge',
  DISCIPLINARY_DISMISSAL: 'Révocation disciplinaire',
  OTHER: 'Autre',
  RETIREMENT: 'Retraite',
  STRIKING_OFF: 'Radiation',
};

export function vacancyReasonOf(id: VacancyReason): { id: VacancyReason; label: string } {
  return { id, label: REASON_LABELS[id] };
}

/** only "other" says nothing by itself */
export function isDetailRequired(reason: VacancyReason): boolean {
  return reason === 'OTHER';
}

export function vacancyReasons(): { detailRequired: boolean; id: VacancyReason; label: string }[] {
  return VACANCY_REASONS.map((id) => ({ ...vacancyReasonOf(id), detailRequired: isDetailRequired(id) }));
}

/**
 * a vacancy holds while LOLFI keeps its magistrat active on its position. LOLFI sends the position as text,
 * read here as a number like the queries do: "0123" is the position 123
 */
export function hasLapsed(
  vacancy: { positionId: number },
  magistrat: { currentPositionId: string | null; status: string },
): boolean {
  return (
    magistrat.status !== 'ACTIVE' ||
    Number.parseInt(magistrat.currentPositionId ?? '', 10) !== vacancy.positionId
  );
}

export class MissingReasonDetail extends Error {}
export class NoDeclaredVacancy extends Error {}
export class UnknownVacancyAttachment extends Error {}

export class PositionVacancyAttachmentRemoved {
  constructor(
    readonly fileId: string,
    readonly magistratId: string,
    readonly positionId: number,
  ) {}
}

export class PositionVacancyAttachmentRenamed {
  constructor(
    readonly fileId: string,
    readonly name: string,
  ) {}
}

export class PositionVacancyDeclared {
  constructor(
    readonly authorId: string,
    readonly fileIds: readonly string[],
    readonly magistratId: string,
    readonly positionId: number,
    readonly reason: VacancyReason,
    readonly reasonDetail: string | null,
    readonly startDate: DateOnly,
  ) {}
}

export class PositionVacancyWithdrawn {
  constructor(
    readonly magistratId: string,
    readonly positionId: number,
  ) {}
}

export type PositionVacancyEvent =
  | PositionVacancyAttachmentRemoved
  | PositionVacancyAttachmentRenamed
  | PositionVacancyDeclared
  | PositionVacancyWithdrawn;

export class PositionVacancy {
  readonly #messages: PositionVacancyEvent[] = [];

  private constructor(
    readonly magistratId: string,
    readonly positionId: number,
    /** null while no vacancy is declared */
    private readonly attachmentIds: readonly string[] | null,
  ) {}

  get messages(): readonly PositionVacancyEvent[] {
    return this.#messages;
  }

  static from(props: {
    attachmentIds: readonly string[] | null;
    magistratId: string;
    positionId: number;
  }): PositionVacancy {
    return new PositionVacancy(props.magistratId, props.positionId, props.attachmentIds);
  }

  /** declaring again replaces the reason and the date: the attachments add up */
  declare(command: {
    authorId: string;
    fileIds: readonly string[];
    reason: VacancyReason;
    reasonDetail: string | null;
    startDate: DateOnly;
  }): void {
    const reasonDetail = command.reasonDetail?.trim() || null;
    if (isDetailRequired(command.reason) && !reasonDetail) throw new MissingReasonDetail();

    this.#messages.push(
      new PositionVacancyDeclared(
        command.authorId,
        command.fileIds,
        this.magistratId,
        this.positionId,
        command.reason,
        isDetailRequired(command.reason) ? reasonDetail : null,
        command.startDate,
      ),
    );
  }

  removeAttachment(fileId: string): void {
    this.#assertAttached(fileId);
    this.#messages.push(new PositionVacancyAttachmentRemoved(fileId, this.magistratId, this.positionId));
  }

  renameAttachment(fileId: string, name: string): void {
    this.#assertAttached(fileId);
    this.#messages.push(new PositionVacancyAttachmentRenamed(fileId, name));
  }

  withdraw(): void {
    if (!this.attachmentIds) throw new NoDeclaredVacancy();
    this.#messages.push(new PositionVacancyWithdrawn(this.magistratId, this.positionId));
  }

  #assertAttached(fileId: string): void {
    if (!this.attachmentIds?.includes(fileId)) throw new UnknownVacancyAttachment();
  }
}
