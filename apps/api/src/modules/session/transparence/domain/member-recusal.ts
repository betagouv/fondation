export const NON_RECUSABLE_REASONS = ['REPORTER'] as const;

export type NonRecusableReasonEnum = (typeof NON_RECUSABLE_REASONS)[number];

export type NonRecusableMember = { id: string; reason: NonRecusableReasonEnum };

export type FileReporters = { latestIds: ReadonlySet<string>; publishedIds: ReadonlySet<string> };

export const NON_AFFECTABLE_REASONS = ['RECUSED', 'EXCLUDED_MAGISTRAT'] as const;

export type NonAffectableReasonEnum = (typeof NON_AFFECTABLE_REASONS)[number];

export type NonAffectableMember = { id: string; reason: NonAffectableReasonEnum };

/**
 * the mirror of nonRecusableMembers: a member recused from a file, or who excluded its proposed
 * magistrat, never becomes its reporter; a recusal says more, so it wins when both apply
 */
export function nonAffectableMembers(file: {
  magistratExcludedIds: ReadonlySet<string>;
  recusedIds: ReadonlySet<string>;
}): NonAffectableMember[] {
  return [
    ...[...file.recusedIds].map((id) => ({ id, reason: 'RECUSED' as const })),
    ...[...file.magistratExcludedIds.difference(file.recusedIds)].map((id) => ({
      id,
      reason: 'EXCLUDED_MAGISTRAT' as const,
    })),
  ];
}

/**
 * the reporters a file refuses: a reporter in place keeps the file when they exclude its magistrat
 * afterwards, until the secretariat removes them, but nobody keeps a file they are recused from
 */
export function refusedReporters(file: {
  assignedIds: ReadonlySet<string>;
  magistratExcludedIds: ReadonlySet<string>;
  recusedIds: ReadonlySet<string>;
  reporterIds: readonly string[];
}): NonAffectableMember[] {
  const reporterIds = new Set(file.reporterIds);
  return nonAffectableMembers(file).filter(
    ({ id, reason }) => reporterIds.has(id) && (reason === 'RECUSED' || !file.assignedIds.has(id)),
  );
}

/**
 * a published reporter keeps their report until a version without them is published,
 * and a reporter of the latest version becomes one once it is
 */
export function nonRecusableMembers(reporters: FileReporters): NonRecusableMember[] {
  return [...reporters.publishedIds.union(reporters.latestIds)].map((id) => ({ id, reason: 'REPORTER' }));
}
