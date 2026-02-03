/** @see https://www.30secondsofcode.org/js/s/remove-accents/ */
export function unaccent(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function capitalize(input: string): string {
  const normalized = unaccent(input);
  let output = '';
  let shouldCapitalize = true;

  for (let i = 0; i < normalized.length; i++) {
    const char = input[i];
    if (!char) continue;

    if (shouldCapitalize) {
      output += char.toUpperCase();
      shouldCapitalize = false;
      continue;
    }

    if (/\W/.test(normalized[i])) shouldCapitalize = true;

    output += char;
  }

  return output;
}

export function pluralize(count: number, key: { one: string; other: string }): string {
  // TODO: use Intl.PluralRules?
  if (count === 1 || count === 0) return key.one;
  return key.other;
}
