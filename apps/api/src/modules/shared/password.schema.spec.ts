import { PasswordSchema } from './password.schema';

describe('PasswordSchema', () => {
  it.each(['Fondation-2026', 'Élysée 2026 bis', '  Fondation-2026  '])('accepts %j', (password) => {
    expect(PasswordSchema.safeParse(password).success).toBe(true);
  });

  it.each([
    'Fon-2026',
    'fondation-2026',
    'FONDATION-2026',
    'Fondation-deux',
    'Fondation2026',
    '   Fon-2026   ',
  ])('refuses %j', (password) => {
    expect(PasswordSchema.safeParse(password).success).toBe(false);
  });
});
