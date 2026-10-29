import { defineMessage, type MessageDescriptor } from 'react-intl';

// mirrors the API's PasswordSchema, to tell the rule before sending
const PASSWORD_RULES: readonly { isMet: (password: string) => boolean; message: MessageDescriptor }[] = [
  {
    isMet: (password) => password.length >= 12,
    message: defineMessage({ defaultMessage: '12 caractères minimum' }),
  },
  {
    isMet: (password) => /\p{Lu}/u.test(password),
    message: defineMessage({ defaultMessage: 'Une majuscule' }),
  },
  {
    isMet: (password) => /\p{Ll}/u.test(password),
    message: defineMessage({ defaultMessage: 'Une minuscule' }),
  },
  { isMet: (password) => /\d/.test(password), message: defineMessage({ defaultMessage: 'Un chiffre' }) },
  {
    isMet: (password) => /[^\p{L}\d]/u.test(password),
    message: defineMessage({ defaultMessage: 'Un caractère spécial, par exemple ! ? @ # -' }),
  },
];

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.isMet(password.trim()));
}

export function passwordRuleStates(password: string, isSubmitted: boolean) {
  return PASSWORD_RULES.map((rule) => ({
    message: rule.message,
    severity: rule.isMet(password.trim())
      ? ('valid' as const)
      : isSubmitted
        ? ('error' as const)
        : ('info' as const),
  }));
}

// the password is read out to the person, so no character is mistaken for another
const PASSWORD_ALPHABETS = [
  'ABCDEFGHJKLMNPQRSTUVWXYZ',
  'abcdefghijkmnopqrstuvwxyz',
  '23456789',
  '!?@#-',
] as const;

function randomIndex(length: number): number {
  const unbiasedLimit = 2 ** 32 - (2 ** 32 % length);
  const value = new Uint32Array(1);
  do crypto.getRandomValues(value);
  while (value[0]! >= unbiasedLimit);
  return value[0]! % length;
}

function randomCharacter(alphabet: string): string {
  return alphabet[randomIndex(alphabet.length)]!;
}

export function generatePassword(): string {
  const allCharacters = PASSWORD_ALPHABETS.join('');
  const characters = [
    ...PASSWORD_ALPHABETS.map(randomCharacter),
    ...Array.from({ length: 12 }, () => randomCharacter(allCharacters)),
  ];
  for (let i = characters.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [characters[i], characters[j]] = [characters[j]!, characters[i]!];
  }
  return characters.join('');
}
