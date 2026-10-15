import { Summary, SummaryCreated, SummarySessionIsArchived } from './summary';

describe('Summary', () => {
  it('should create the summary of a file of an open session', () => {
    const summary = Summary.create({
      nominationFileId: 'file-1',
      sessionId: 'session-1',
      sessionIsArchived: false,
    });

    expect(summary.messages).toEqual([new SummaryCreated('session-1', summary.id)]);
  });

  it('should refuse to create the summary of a file of an archived session', () => {
    expect(() =>
      Summary.create({ nominationFileId: 'file-1', sessionId: 'session-1', sessionIsArchived: true }),
    ).toThrow(SummarySessionIsArchived);
  });

  it('should refuse to load the summary of a file of an archived session', () => {
    expect(() =>
      Summary.from({ authorId: null, id: 'file-1', sessionId: 'session-1', sessionIsArchived: true }),
    ).toThrow(SummarySessionIsArchived);
  });
});
