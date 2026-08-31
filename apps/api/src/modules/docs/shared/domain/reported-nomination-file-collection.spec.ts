import { NominationFileOutcome } from 'src/modules/session/shared/types/nomination-file-outcome';
import { makeId } from 'src/utils/id';

import { nominationFileOutcomeToDocNominationFileOutcome } from './doc-nomination-file-outcome';
import { ReportedNominationFileCollection } from './reported-nomination-file-collection';

const FINAL_OUTCOMES = [
  ...new Set(NominationFileOutcome.finalOutcomes().map(nominationFileOutcomeToDocNominationFileOutcome)),
];

const NON_FINAL_OUTCOMES = [
  ...new Set(NominationFileOutcome.nonFinalOutcomes().map(nominationFileOutcomeToDocNominationFileOutcome)),
];

describe('ReportedNominationFileCollection', () => {
  it.each(FINAL_OUTCOMES)(`should be reported for "%s"`, (outcome) => {
    const nominationFileId = makeId('NominationFileId');
    const collection = ReportedNominationFileCollection.from([
      { outcome, nominationFileId, isValidated: true, officialReportId: makeId('OfficialReportId') },
    ]);

    expect(collection.isReported({ nominationFileId })).toBe(true);
  });

  it.each(NON_FINAL_OUTCOMES)(`should NOT be reported for "%s"`, (outcome) => {
    const nominationFileId = makeId('NominationFileId');
    const collection = ReportedNominationFileCollection.from([
      { outcome, nominationFileId, isValidated: true, officialReportId: makeId('OfficialReportId') },
    ]);

    expect(collection.isReported({ nominationFileId })).toBe(false);
  });

  it('should be reported when appearing in at least one officialReport', () => {
    const nominationFileId = makeId('NominationFileId');
    const collection = ReportedNominationFileCollection.from([
      {
        outcome: 'SUSPENDED',
        nominationFileId,
        isValidated: true,
        officialReportId: makeId('OfficialReportId'),
      },
      {
        outcome: 'SUSPENDED',
        nominationFileId,
        isValidated: true,
        officialReportId: makeId('OfficialReportId'),
      },
      {
        outcome: 'VALIDATED',
        nominationFileId,
        isValidated: true,
        officialReportId: makeId('OfficialReportId'),
      },
    ]);

    expect(collection.isReported({ nominationFileId })).toBe(true);
  });

  it('should ignore an officialReport', () => {
    const ignoredOfficialReportId = makeId('OfficialReportId');
    const nominationFileId = makeId('NominationFileId');
    const collection = ReportedNominationFileCollection.from([
      {
        outcome: 'SUSPENDED',
        nominationFileId,
        isValidated: true,
        officialReportId: makeId('OfficialReportId'),
      },
      {
        outcome: 'SUSPENDED',
        nominationFileId,
        isValidated: true,
        officialReportId: makeId('OfficialReportId'),
      },
      {
        outcome: 'VALIDATED',
        nominationFileId,
        isValidated: true,
        officialReportId: ignoredOfficialReportId,
      },
    ]);

    const isReported = collection.isReported({
      nominationFileId,
      ignoreOfficialReportId: ignoredOfficialReportId,
    });
    expect(isReported).toBe(false);
  });

  it('is only drafted as long as no official report holding it is validated', () => {
    const nominationFileId = makeId('NominationFileId');
    const collection = ReportedNominationFileCollection.from([
      {
        outcome: 'VALIDATED',
        nominationFileId,
        isValidated: false,
        officialReportId: makeId('OfficialReportId'),
      },
    ]);

    expect(collection.reportedState({ nominationFileId })).toBe('DRAFT');
    expect(collection.isReported({ nominationFileId })).toBe(true);
  });

  it('is validated as soon as one official report holding it is validated', () => {
    const nominationFileId = makeId('NominationFileId');
    const collection = ReportedNominationFileCollection.from([
      {
        outcome: 'VALIDATED',
        nominationFileId,
        isValidated: false,
        officialReportId: makeId('OfficialReportId'),
      },
      {
        outcome: 'VALIDATED',
        nominationFileId,
        isValidated: true,
        officialReportId: makeId('OfficialReportId'),
      },
    ]);

    expect(collection.reportedState({ nominationFileId })).toBe('VALIDATED');
  });

  it('is held by no official report when it appears in none', () => {
    const nominationFileId = makeId('NominationFileId');

    expect(ReportedNominationFileCollection.from([]).reportedState({ nominationFileId })).toBe('NONE');
  });
});
