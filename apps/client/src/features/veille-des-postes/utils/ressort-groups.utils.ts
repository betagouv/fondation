/** the rows of a ressort but its last, under which the ressort cell hides the line between rows */
export function rowsInsideRessortGroups(rows: readonly { id: string; ressortId: string }[]): Set<string> {
  return new Set(
    rows.filter((row, index) => rows[index + 1]?.ressortId === row.ressortId).map(({ id }) => id),
  );
}
