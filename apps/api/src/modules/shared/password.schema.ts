import z from 'zod';

// trimmed like at login, which would otherwise refuse a password ending with a space
// CNIL deliberation 2022-100, for a password alone with unlimited attempts: 12 characters of the 4 kinds
export const PasswordSchema = z
  .string()
  .trim()
  .min(12, '12 caractères minimum')
  .regex(/\p{Lu}/u, 'Une majuscule')
  .regex(/\p{Ll}/u, 'Une minuscule')
  .regex(/\d/, 'Un chiffre')
  .regex(/[^\p{L}\d]/u, 'Un caractère spécial, par exemple ! ? @ # -');
