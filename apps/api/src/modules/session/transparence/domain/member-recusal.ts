export const NON_RECUSABLE_REASONS = ['REPORTER'] as const;

export type NonRecusableReasonEnum = (typeof NON_RECUSABLE_REASONS)[number];

export type NonRecusableMember = { id: string; reason: NonRecusableReasonEnum };

export type FileReporters = { latestIds: ReadonlySet<string>; publishedIds: ReadonlySet<string> };

export const NON_AFFECTABLE_REASONS = ['RECUSED'] as const;

export type NonAffectableReasonEnum = (typeof NON_AFFECTABLE_REASONS)[number];

export type NonAffectableMember = { id: string; reason: NonAffectableReasonEnum };

/**
 * the mirror of nonRecusableMembers: a member recused from a file never becomes its reporter,
 * while a reporter of the latest version recused before the rule keeps their place
 */
export function nonAffectableMembers(file: {
  assignedReporterIds: ReadonlySet<string>;
  recusedIds: ReadonlySet<string>;
}): NonAffectableMember[] {
  return [...file.recusedIds.difference(file.assignedReporterIds)].map((id) => ({ id, reason: 'RECUSED' }));
}

/**
 * a published reporter keeps their report until a version without them is published,
 * and a reporter of the latest version becomes one once it is
 */
export function nonRecusableMembers(reporters: FileReporters): NonRecusableMember[] {
  return [...reporters.publishedIds.union(reporters.latestIds)].map((id) => ({ id, reason: 'REPORTER' }));
}
