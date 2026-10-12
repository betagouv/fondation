/**
 * the agenda content the other documents speak of: its validated version, or its draft while the
 * agenda has never been validated, which is the one case where nothing else exists to speak of.
 * Reading only the validated one would hide every agenda awaiting its first validation.
 */
export const AGENDA_CONTENT_VERSIONS = { orderBy: { version: 'desc' }, take: 2 } as const;

export function agendaContentOf<T extends { status: 'DRAFT' | 'VALIDATED' }>(
  versions: readonly T[],
): T | undefined {
  return versions.find(({ status }) => status === 'VALIDATED') ?? versions[0];
}
