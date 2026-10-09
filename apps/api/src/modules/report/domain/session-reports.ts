import type { FormationEnum } from 'src/modules/shared/formation.enum';

type Affectation = { nominationFileId: string; reporterId: string };
export type SessionReport = Affectation & {
  createdAt: Date;
  hasContent: boolean;
  id: string;
  isDeleted: boolean;
};

export class ReportsCreated {
  constructor(
    readonly sessionId: string,
    readonly formation: FormationEnum,
    readonly affectations: readonly Affectation[],
  ) {}
}

export class ReportsRestored {
  constructor(readonly reportIds: readonly string[]) {}
}

export class ReportsDeleted {
  constructor(readonly reportIds: readonly string[]) {}
}

export type SessionReportsEvent = ReportsCreated | ReportsDeleted | ReportsRestored;

const keyOf = (affectation: Affectation) => `${affectation.nominationFileId}:${affectation.reporterId}`;

/**
 * a published affectation gives each of its reporters a report: the reports of a reporter taken off
 * a file are only marked deleted, for their content to come back if the reporter is affected again.
 * Older publications left several deleted reports for a same reporter and file: only one comes back,
 * the one holding content first, else the latest
 */
export class SessionReports {
  readonly #messages: SessionReportsEvent[] = [];

  private constructor(
    readonly sessionId: string,
    private readonly reports: readonly SessionReport[],
  ) {}

  get messages(): readonly SessionReportsEvent[] {
    return this.#messages;
  }

  static from(props: { reports: readonly SessionReport[]; sessionId: string }): SessionReports {
    return new SessionReports(props.sessionId, props.reports);
  }

  syncWith(command: { affectations: readonly Affectation[]; formation: FormationEnum }): void {
    const affected = new Map(command.affectations.map((affectation) => [keyOf(affectation), affectation]));
    const reportsByKey = Map.groupBy(this.reports, keyOf);
    const deletedIds: string[] = [];
    const restoredIds: string[] = [];
    const missing: Affectation[] = [];

    for (const [key, affectation] of affected) {
      const reports = reportsByKey.get(key) ?? [];
      if (reports.some(({ isDeleted }) => !isDeleted)) continue;

      const restorable = reports.toSorted(
        (a, b) =>
          Number(b.hasContent) - Number(a.hasContent) || b.createdAt.getTime() - a.createdAt.getTime(),
      )[0];
      if (restorable) restoredIds.push(restorable.id);
      else missing.push(affectation);
    }

    for (const report of this.reports) {
      if (!report.isDeleted && !affected.has(keyOf(report))) deletedIds.push(report.id);
    }

    if (restoredIds.length > 0) this.#messages.push(new ReportsRestored(restoredIds));
    if (deletedIds.length > 0) this.#messages.push(new ReportsDeleted(deletedIds));
    if (missing.length > 0) {
      this.#messages.push(new ReportsCreated(this.sessionId, command.formation, missing));
    }
  }
}
