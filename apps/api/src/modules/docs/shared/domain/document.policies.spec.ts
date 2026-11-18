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
    expect(canDiscardDraft({ changesBy: 'PERSON', hasValidatedVersion: true, systemCauses: [] })).toBe(true);
  });

  it('should keep a draft that has no validated version to fall back on', () => {
    expect(canDiscardDraft({ changesBy: 'PERSON', hasValidatedVersion: false, systemCauses: [] })).toBe(
      false,
    );
  });

  it.each(['SYSTEM', 'PERSON_AND_SYSTEM'] as const)(
    'should keep a draft the application changed (%s)',
    (changesBy) => {
      expect(canDiscardDraft({ changesBy, hasValidatedVersion: true, systemCauses: ['REPORTERS'] })).toBe(
        false,
      );
    },
  );

  it.each(['SYSTEM', 'PERSON_AND_SYSTEM'] as const)(
    'should let a draft the application only changed to follow a new name be dropped (%s)',
    (changesBy) => {
      expect(canDiscardDraft({ changesBy, hasValidatedVersion: true, systemCauses: ['DESIGNATION'] })).toBe(
        true,
      );
    },
  );

  it('should keep a draft the application changed for a new name and for another cause', () => {
    expect(
      canDiscardDraft({
        changesBy: 'PERSON_AND_SYSTEM',
        hasValidatedVersion: true,
        systemCauses: ['DESIGNATION', 'OUTCOME'],
      }),
    ).toBe(false);
  });

  it('should keep a draft the application changed before its causes were recorded', () => {
    expect(
      canDiscardDraft({ changesBy: 'PERSON_AND_SYSTEM', hasValidatedVersion: true, systemCauses: [] }),
    ).toBe(false);
  });

  it('should have nothing to discard without a draft', () => {
    expect(canDiscardDraft({ changesBy: null, hasValidatedVersion: true, systemCauses: [] })).toBe(false);
  });
});
