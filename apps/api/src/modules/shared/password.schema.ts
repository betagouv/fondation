import z from 'zod';

// trimmed like at login, which would otherwise refuse a password ending with a space
// CNIL deliberation 2022-100, for a password alone with unlimited attempts: 12 characters of the 4 kinds
// refine and not regex, whose patterns OpenAPI turns into an allOf that hey-api types as unknown
export const PasswordSchema = z
  .string()
  .trim()
  .min(12, '12 caractères minimum')
  .refine((password) => /\p{Lu}/u.test(password), 'Une majuscule')
  .refine((password) => /\p{Ll}/u.test(password), 'Une minuscule')
  .refine((password) => /\d/.test(password), 'Un chiffre')
  .refine((password) => /[^\p{L}\d]/u.test(password), 'Un caractère spécial, par exemple ! ? @ # -');
