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

// TODO: see requiresElision in apps/api/src/modules/docs/shared/infrastructure/services/renderers/helpers.ts
const ELIDING_INITIALS = new Set(['a', 'e', 'h', 'i', 'o', 'u', 'y']);
export function requiresElision(word: string): boolean {
  const first = unaccent(word).trim()[0]?.toLowerCase();
  return !!first && ELIDING_INITIALS.has(first);
}

// LOLFI stores phone numbers as typed: only ten-digit numbers are grouped, anything else is shown as is
export function formatPhoneNumber(input: string): string {
  const digits = input.replace(/[\s.-]/g, '');
  return /^\d{10}$/.test(digits) ? digits.replace(/(\d{2})(?=\d)/g, '$1 ') : input;
}
