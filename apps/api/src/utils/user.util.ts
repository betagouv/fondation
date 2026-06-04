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

export function initials(user: { firstName: string; lastName: string }) {
  return `${retrieveInitials(user.firstName)}${retrieveInitials(user.lastName)}`;
}
