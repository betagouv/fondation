export const NON_RECUSABLE_REASONS = ['REPORTER'] as const;

export type NonRecusableReasonEnum = (typeof NON_RECUSABLE_REASONS)[number];

export type NonRecusableMember = { id: string; reason: NonRecusableReasonEnum };

export type FileReporters = { latestIds: ReadonlySet<string>; publishedIds: ReadonlySet<string> };

export const NON_AFFECTABLE_REASONS = ['RECUSED', 'EXCLUDED_MAGISTRAT'] as const;

export type NonAffectableReasonEnum = (typeof NON_AFFECTABLE_REASONS)[number];

export type NonAffectableMember = { id: string; reason: NonAffectableReasonEnum };

export const REPORTER_WARNING_REASONS = ['EXCLUDED_MAGISTRAT'] as const;

export type ReporterWarningReasonEnum = (typeof REPORTER_WARNING_REASONS)[number];

export type ReporterWarning = { id: string; reason: ReporterWarningReasonEnum };

type FileAffectability = {
  /** the reporters of the latest version */
  assignedIds: ReadonlySet<string>;
  magistratExcludedIds: ReadonlySet<string>;
  recusedIds: ReadonlySet<string>;
};

/**
 * the mirror of nonRecusableMembers: a member recused from a file, or who excluded its proposed
 * magistrat, never becomes its reporter; a recusal says more, so it wins when both apply. A reporter
 * in place keeps the file when they exclude its magistrat afterwards, until the secretariat removes
 * them, but nobody keeps a file they are recused from
 */
export function nonAffectableMembers(file: FileAffectability): NonAffectableMember[] {
  return [
    ...[...file.recusedIds].map((id) => ({ id, reason: 'RECUSED' as const })),
    ...[...file.magistratExcludedIds.difference(file.recusedIds).difference(file.assignedIds)].map((id) => ({
      id,
      reason: 'EXCLUDED_MAGISTRAT' as const,
    })),
  ];
}

/** the reporters in place the secretariat is warned about, who keep the file until removed */
export function reporterWarnings(file: Omit<FileAffectability, 'recusedIds'>): ReporterWarning[] {
  return [...file.magistratExcludedIds.intersection(file.assignedIds)].map((id) => ({
    id,
    reason: 'EXCLUDED_MAGISTRAT',
  }));
}

/** the reporters an affectation names that the file refuses */
export function refusedReporters(
  file: FileAffectability & { reporterIds: readonly string[] },
): NonAffectableMember[] {
  const reporterIds = new Set(file.reporterIds);
  return nonAffectableMembers(file).filter(({ id }) => reporterIds.has(id));
}

/**
 * a published reporter keeps their report until a version without them is published,
 * and a reporter of the latest version becomes one once it is
 */
export function nonRecusableMembers(reporters: FileReporters): NonRecusableMember[] {
  return [...reporters.publishedIds.union(reporters.latestIds)].map((id) => ({ id, reason: 'REPORTER' }));
}
