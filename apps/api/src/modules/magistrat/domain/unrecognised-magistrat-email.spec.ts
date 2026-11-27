import {
  InactiveMagistrat,
  normalizedEmail,
  oldestKeptAttemptAt,
  UnrecognisedMagistratEmail,
  UnrecognisedMagistratEmailAttached,
  UnrecognisedMagistratEmailDismissed,
} from './unrecognised-magistrat-email';

const authorId = 'a1b2c3d4-0000-4000-8000-000000000001';
const id = 'a1b2c3d4-0000-4000-8000-000000000002';
const magistratId = 'a1b2c3d4-0000-4000-8000-000000000003';
const email = 'jean.dupont@exemple.fr';

describe('UnrecognisedMagistratEmail', () => {
  it('should attach the address to an active magistrat', () => {
    const unrecognised = UnrecognisedMagistratEmail.from({ email, id });

    unrecognised.attachTo({ authorId, magistrat: { id: magistratId, status: 'ACTIVE' } });

    expect(unrecognised.messages).toEqual([
      new UnrecognisedMagistratEmailAttached(authorId, email, id, magistratId),
    ]);
  });

  it('should refuse an inactive magistrat', () => {
    const unrecognised = UnrecognisedMagistratEmail.from({ email, id });

    expect(() =>
      unrecognised.attachTo({ authorId, magistrat: { id: magistratId, status: 'INACTIVE' } }),
    ).toThrow(InactiveMagistrat);
    expect(unrecognised.messages).toEqual([]);
  });

  it('should set the address aside', () => {
    const unrecognised = UnrecognisedMagistratEmail.from({ email, id });

    unrecognised.dismiss();

    expect(unrecognised.messages).toEqual([new UnrecognisedMagistratEmailDismissed(id)]);
  });

  it('should read an address whatever its case', () => {
    expect(normalizedEmail('Jean.Dupont@Exemple.FR')).toBe(email);
  });

  it('should keep the attempts of the last 30 days', () => {
    expect(oldestKeptAttemptAt(new Date('2026-11-27T10:00:00Z'))).toEqual(new Date('2026-10-28T10:00:00Z'));
  });
});
