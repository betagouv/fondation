import { draftChangesBy } from './draft-changes-by';

const UPDATED_AT = new Date('2026-09-24T10:00:00.000Z');

describe('draftChangesBy', () => {
  it('should be nothing for a validated version', () => {
    expect(
      draftChangesBy({ createdBy: 'user-1', status: 'VALIDATED', systemUpdatedAt: null, updatedBy: null }),
    ).toBeNull();
  });

  it('should be a person who opened the draft', () => {
    expect(
      draftChangesBy({ createdBy: 'user-1', status: 'DRAFT', systemUpdatedAt: null, updatedBy: null }),
    ).toBe('PERSON');
  });

  it('should be the application while nobody opened nor edited the draft', () => {
    expect(
      draftChangesBy({ createdBy: null, status: 'DRAFT', systemUpdatedAt: UPDATED_AT, updatedBy: null }),
    ).toBe('SYSTEM');
  });

  it('should be the application for a draft opened before it kept the trace', () => {
    expect(draftChangesBy({ createdBy: null, status: 'DRAFT', systemUpdatedAt: null, updatedBy: null })).toBe(
      'SYSTEM',
    );
  });

  it('should be both when a person edited a draft the application opened', () => {
    expect(
      draftChangesBy({ createdBy: null, status: 'DRAFT', systemUpdatedAt: UPDATED_AT, updatedBy: 'user-1' }),
    ).toBe('PERSON_AND_SYSTEM');
  });

  it('should be both when the application changed a draft a person opened', () => {
    expect(
      draftChangesBy({ createdBy: 'user-1', status: 'DRAFT', systemUpdatedAt: UPDATED_AT, updatedBy: null }),
    ).toBe('PERSON_AND_SYSTEM');
  });
});
