import { canReadSummary, canWriteSummary } from './summary.policies';

const secretariat = { id: 'sg-1', role: 'ADJOINT_SECRETAIRE_GENERAL' } as const;
const reader = { id: 'member-1', role: 'MEMBRE_DU_SIEGE' } as const;
const member = { id: 'member-2', role: 'MEMBRE_DU_PARQUET' } as const;

describe('canReadSummary', () => {
  describe('given a summary without author', () => {
    const summary = { authorId: null, readerIds: [reader.id] };

    it('lets the secretariat read it', () => {
      expect(canReadSummary(summary, secretariat)).toBe(true);
    });

    it('lets its readers read it', () => {
      expect(canReadSummary(summary, reader)).toBe(true);
    });

    it('hides it from other members', () => {
      expect(canReadSummary(summary, member)).toBe(false);
    });
  });

  describe('given a summary with an author', () => {
    const summary = { authorId: 'sg-2', readerIds: [reader.id] };

    it('lets its author read it', () => {
      expect(canReadSummary(summary, { id: 'sg-2', role: 'ADJOINT_SECRETAIRE_GENERAL' })).toBe(true);
    });

    it('lets its readers read it', () => {
      expect(canReadSummary(summary, reader)).toBe(true);
    });

    it('hides it from the rest of the secretariat', () => {
      expect(canReadSummary(summary, secretariat)).toBe(false);
    });
  });
});

describe('canWriteSummary', () => {
  it('lets the secretariat write a summary without author', () => {
    expect(canWriteSummary({ authorId: null }, secretariat)).toBe(true);
  });

  it('keeps a summary without author away from members', () => {
    expect(canWriteSummary({ authorId: null }, reader)).toBe(false);
  });

  it('leaves a summary with an author to its author', () => {
    expect(canWriteSummary({ authorId: 'sg-2' }, secretariat)).toBe(false);
  });
});
