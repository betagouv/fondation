import z from 'zod';

import { capitalize } from './capitalize';
import { unaccent } from './unaccent';

function retrieveInitials(word: string): string {
  let shouldUseLetter = true;
  let letters: string[] = [];
  const normalized = unaccent(word);

  for (let i = 0; i < word.length; i++) {
    const letter = word[i];
    if (!letter) continue;

    if (shouldUseLetter) {
      letters.push(letter.toUpperCase());
      shouldUseLetter = false;
    }

    const c = normalized[i];
    if (c && /\W/.test(c)) shouldUseLetter = true;
  }

  return letters.join('');
}

export function fullname(user: { firstName: string; lastName: string }): string {
  return `${capitalize(user.firstName)}\u00A0${user.lastName.toUpperCase()}`;
}

/** null when the application did it, or its author is gone */
export const writerSchema = z.object({ id: z.string(), name: z.string() }).nullable();

export function writerOf(
  user: { firstName: string; id: string; lastName: string } | null,
): z.infer<typeof writerSchema> {
  return user ? { id: user.id, name: fullname(user) } : null;
}

export function initials(user: { firstName: string; lastName: string }) {
  return `${retrieveInitials(user.firstName)}${retrieveInitials(user.lastName)}`;
}
