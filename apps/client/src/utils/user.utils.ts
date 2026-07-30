import { capitalize, unaccent } from './string.utils';

type Person = { firstName: string; lastName: string; usedName?: string | null };

function upperLastName(person: Person) {
  return (person.usedName?.trim() || person.lastName.trim()).toUpperCase();
}

// Honorine
export function capitalizedFirstName(person: Person) {
  return capitalize(person.firstName.toLowerCase());
}

// VALROSE HONORINE
export function fullNameUpperCase(person: Person) {
  return `${upperLastName(person)} ${person.firstName.toUpperCase()}`;
}

// VALROSE Honorine
export function fullNameCapitalized(person: Person) {
  return `${upperLastName(person)} ${capitalizedFirstName(person)}`;
}

// Honorine VALROSE
export function memberFullName(person: Person) {
  return `${capitalizedFirstName(person)} ${upperLastName(person)}`;
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
