import { capitalize, unaccent } from './string.utils';

type Person = { firstName: string; lastName: string };

// Honorine
export function capitalizedFirstName(person: Person) {
  return capitalize(person.firstName.toLowerCase());
}

// Honorine VALROSE
export function memberFullName(person: Person) {
  return `${capitalizedFirstName(person)} ${person.lastName.trim().toUpperCase()}`;
}

function extractInitial(word: string) {
  const normalized = unaccent(word);
  let shouldUseLetter = true;

  const letters: string[] = [];

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

export function toInitials(user: { firstName: string; lastName: string }): string {
  return `${extractInitial(user.firstName)}${extractInitial(user.lastName)}`;
}
