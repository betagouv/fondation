import { draftChangesBy, draftLastChange } from './draft-changes-by';

const UPDATED_AT = new Date('2026-09-24T10:00:00.000Z');

describe('draftLastChange', () => {
  const person = { firstName: 'Jeanne', id: 'user-1', lastName: 'Dupont' };
  const untouched = {
    author: person,
    createdAt: new Date('2026-09-24T09:00:00.000Z'),
    editor: null,
    systemUpdatedAt: null,
    systemUpdates: [],
    updatedAt: null,
  };

  it('should be nothing for a first draft nobody edited, its creation is already told', () => {
    expect(draftLastChange(untouched, { overValidated: false })).toBeNull();
  });

  it('should be the person who edited a first draft', () => {
    expect(
      draftLastChange({ ...untouched, editor: person, updatedAt: UPDATED_AT }, { overValidated: false }),
    ).toEqual({ at: UPDATED_AT, by: person, causes: [], origin: 'PERSON' });
  });

  it('should be the person who opened a draft over a validated version', () => {
    expect(draftLastChange(untouched, { overValidated: true })).toEqual({
      at: untouched.createdAt,
      by: person,
      causes: [],
      origin: 'PERSON',
    });
  });

  it('should be the application when it opened a draft over a validated version', () => {
    expect(draftLastChange({ ...untouched, author: null }, { overValidated: true })).toMatchObject({
      by: null,
      origin: 'SYSTEM',
    });
  });
});

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
