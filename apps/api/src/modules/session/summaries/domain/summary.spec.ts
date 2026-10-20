import {
  Summary,
  SummaryCreated,
  SummarySessionIsArchived,
  UnknownReader,
  UpdatedSummaryReaderList,
} from './summary';

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
      Summary.from({
        authorId: null,
        id: 'file-1',
        readerIds: [],
        sessionId: 'session-1',
        sessionIsArchived: true,
      }),
    ).toThrow(SummarySessionIsArchived);
  });

  describe('readers', () => {
    const summary = () =>
      Summary.from({
        authorId: null,
        id: 'file-1',
        readerIds: ['deactivated-reader'],
        sessionId: 'session-1',
        sessionIsArchived: false,
      });

    it('should keep a reader deactivated since', () => {
      const read = summary();

      read.updateReadersList({
        availableUserIds: new Set(['reader-1']),
        readerIds: ['deactivated-reader', 'reader-1'],
      });

      expect(read.messages).toEqual([
        new UpdatedSummaryReaderList(read.id, ['deactivated-reader', 'reader-1']),
      ]);
    });

    it('should refuse a new reader who is not available, deactivated for instance', () => {
      expect(() =>
        summary().updateReadersList({ availableUserIds: new Set(), readerIds: ['another-deactivated'] }),
      ).toThrow(UnknownReader);
    });
  });
});
