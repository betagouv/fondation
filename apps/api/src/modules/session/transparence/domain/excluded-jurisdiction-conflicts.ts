type Jurisdiction = { id: string; label: string | null };
type Member = { id: string; firstName: string; lastName: string };

export type ExcludedJurisdictionConflict = { jurisdiction: Jurisdiction; member: Member };

export function excludedJurisdictionConflicts(
  jurisdictions: { current: Jurisdiction | null; targeted: Jurisdiction | null },
  excludingMembers: ReadonlyMap<string, readonly Member[]>,
): ExcludedJurisdictionConflict[] {
  const distinct = new Map(
    [jurisdictions.current, jurisdictions.targeted]
      .filter((jurisdiction) => jurisdiction !== null)
      .map((jurisdiction) => [jurisdiction.id, jurisdiction]),
  );

  return [...distinct.values()].flatMap((jurisdiction) =>
    (excludingMembers.get(jurisdiction.id) ?? []).map((member) => ({ jurisdiction, member })),
  );
}
