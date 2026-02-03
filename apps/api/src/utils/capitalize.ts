import { unaccent } from './unaccent';

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

    const c = normalized[i];
    if (c && /\W/.test(c)) shouldCapitalize = true;

    output += char;
  }

  return output;
}
