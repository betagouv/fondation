import { isSecretariat, type RoleEnum } from '../role.enum';

export function canReadSummary(
  summary: { authorId: string | null; readerIds: readonly string[] },
  user: { id: string; role: RoleEnum },
): boolean {
  return canWriteSummary(summary, user) || summary.readerIds.includes(user.id);
}

/** until someone writes it, a summary has no author and any secretariat member may take it */
export function canWriteSummary(
  summary: { authorId: string | null },
  user: { id: string; role: RoleEnum },
): boolean {
  return summary.authorId ? summary.authorId === user.id : isSecretariat(user.role);
}
