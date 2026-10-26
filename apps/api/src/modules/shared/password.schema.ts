import z from 'zod';

// trimmed like at login, which would otherwise refuse a password ending with a space
export const PasswordSchema = z.string().trim().min(8);
