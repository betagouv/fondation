/** @see https://www.30secondsofcode.org/js/s/remove-accents/ */
export function unaccent(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
