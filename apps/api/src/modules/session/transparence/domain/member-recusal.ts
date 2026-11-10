export const NON_RECUSABLE_REASONS = ['REPORTER'] as const;

export type NonRecusableReasonEnum = (typeof NON_RECUSABLE_REASONS)[number];

export type NonRecusableMember = { id: string; reason: NonRecusableReasonEnum };

export type FileReporters = { latestIds: ReadonlySet<string>; publishedIds: ReadonlySet<string> };

/**
 * a published reporter keeps their report until a version without them is published,
 * and a reporter of the latest version becomes one once it is
 */
export function nonRecusableMembers(reporters: FileReporters): NonRecusableMember[] {
  return [...reporters.publishedIds.union(reporters.latestIds)].map((id) => ({ id, reason: 'REPORTER' }));
}
