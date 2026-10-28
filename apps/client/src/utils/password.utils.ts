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
