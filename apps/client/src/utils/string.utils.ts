export function capitalize(input: string): string {
  let output = '';
  let shouldCapitalize = true;
  for (const char of input) {
    if (shouldCapitalize) {
      output += char.toUpperCase();
      shouldCapitalize = false;
      continue;
    }

    shouldCapitalize = /\W/.test(char);
    output += char;
  }

  return output;
}
export function pluralize(count: number, key: { one: string; other: string }): string {
  // TODO: use Intl.PluralRules?
  if (count === 1 || count === 0) return key.one;
  return key.other;
}
