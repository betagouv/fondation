import type { ListedFollowedUpObservationSessionYearsDto } from '@api/types';

// the years of the sessions with an observation that has a suite, and the values still checked: a year whose
// last suite was just removed, or a value edited by hand in the link, stays offered, else it could not be unchecked
export function toSessionYearOptions(
  data: ListedFollowedUpObservationSessionYearsDto,
  checked: readonly string[],
) {
  const years = new Set([...data.items.map(({ year }) => String(year)), ...checked]);
  return [...years].toSorted((a, b) => b.localeCompare(a)).map((year) => ({ id: year, label: year }));
}
