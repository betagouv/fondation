import { canDiscardDraft, canValidateDocument } from './document.policies';

describe('canValidateDocument', () => {
  it('should let a draft be validated', () => {
    expect(canValidateDocument({ isValidated: false })).toBe(true);
  });

  it('should have nothing to validate once validated', () => {
    expect(canValidateDocument({ isValidated: true })).toBe(false);
  });
});

describe('canDiscardDraft', () => {
  it('should let a person drop the draft they changed over a validated version', () => {
    expect(canDiscardDraft({ changesBy: 'PERSON', hasValidatedVersion: true })).toBe(true);
  });

  it('should keep a draft that has no validated version to fall back on', () => {
    expect(canDiscardDraft({ changesBy: 'PERSON', hasValidatedVersion: false })).toBe(false);
  });

  it.each(['SYSTEM', 'PERSON_AND_SYSTEM'] as const)(
    'should keep a draft the application changed (%s)',
    (changesBy) => {
      expect(canDiscardDraft({ changesBy, hasValidatedVersion: true })).toBe(false);
    },
  );

  it('should have nothing to discard without a draft', () => {
    expect(canDiscardDraft({ changesBy: null, hasValidatedVersion: true })).toBe(false);
  });
});
