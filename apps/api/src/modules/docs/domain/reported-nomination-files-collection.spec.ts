import { ReportedNominationFilesCollection } from './reported-nomination-files-collection';

describe('ReportedNominationFilesCollection', () => {
  it('should find an already reported nomination file', () => {
    const reports = ReportedNominationFilesCollection.from({
      reports: [
        { reportedIn: 'agenda-1', outcome: 'VALIDATED', nominationFileId: 'nf-1' },
        { reportedIn: 'agenda-1', outcome: 'VALIDATED', nominationFileId: 'nf-2' },
        { reportedIn: 'agenda-1', outcome: 'VALIDATED', nominationFileId: 'nf-3' },
      ],
    });

    expect(reports.wasFileReported({ fileId: 'nf-2' })).toBe(true);
  });

  it('should ignore a null outcome', () => {
    const reports = ReportedNominationFilesCollection.from({
      reports: [{ reportedIn: 'agenda-1', outcome: null, nominationFileId: 'nf-1' }],
    });

    expect(reports.wasFileReported({ fileId: 'nf-1' })).toBe(false);
  });

  it('should ignore a SUSPENDED outcome', () => {
    const reports = ReportedNominationFilesCollection.from({
      reports: [{ reportedIn: 'agenda-1', outcome: 'SUSPENDED', nominationFileId: 'nf-1' }],
    });

    expect(reports.wasFileReported({ fileId: 'nf-1' })).toBe(false);
  });

  it('should ignore an agenda', () => {
    const reports = ReportedNominationFilesCollection.from({
      reports: [
        { reportedIn: 'agenda-1', outcome: 'VALIDATED', nominationFileId: 'nf-1' },
        { reportedIn: 'agenda-1', outcome: 'VALIDATED', nominationFileId: 'nf-2' },
        { reportedIn: 'agenda-1', outcome: 'VALIDATED', nominationFileId: 'nf-3' },
      ],
    });

    expect(reports.wasFileReported({ fileId: 'nf-2', ignore: 'agenda-1' })).toBe(false);
  });

  it('should allow multiple agendas', () => {
    const reports = ReportedNominationFilesCollection.from({
      reports: [
        { reportedIn: 'agenda-1', outcome: null, nominationFileId: 'nf-1' },
        { reportedIn: 'agenda-2', outcome: 'SUSPENDED', nominationFileId: 'nf-1' },
        { reportedIn: 'agenda-3', outcome: 'VALIDATED', nominationFileId: 'nf-1' },
      ],
    });

    expect(reports.wasFileReported({ fileId: 'nf-1' }));
  });
});
