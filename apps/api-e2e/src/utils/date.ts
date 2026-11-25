/** a date the API serves as `{ day, month, year }`, in the `yyyy-MM-dd` form it takes in a body */
export function isoDate(date: { day: number; month: number; year: number }): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}
