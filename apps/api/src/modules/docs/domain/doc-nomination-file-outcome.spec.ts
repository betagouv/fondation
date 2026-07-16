import { NominationFileOutcomeEnum } from 'src/modules/session/domain/nomination-file-outcome';

import {
  docNominationFileOutcomeLabel,
  nominationFileOutcomeToDocNominationFileOutcome,
} from './doc-nomination-file-outcome';

describe('docNominationFileOutcomeLabel', () => {
  it('labels the decision outcomes according to the formation', () => {
    expect(docNominationFileOutcomeLabel({ outcome: 'VALIDATED', formation: 'PARQUET' })).toBe(
      'avis favorable',
    );
    expect(docNominationFileOutcomeLabel({ outcome: 'VALIDATED', formation: 'SIEGE' })).toBe('avis conforme');
    expect(docNominationFileOutcomeLabel({ outcome: 'NON_VALIDATED', formation: 'PARQUET' })).toBe(
      'avis défavorable',
    );
    expect(docNominationFileOutcomeLabel({ outcome: 'NON_VALIDATED', formation: 'SIEGE' })).toBe(
      'avis non conforme',
    );
  });

  it('labels the grouped outcomes with the official documents vocabulary', () => {
    expect(docNominationFileOutcomeLabel({ outcome: 'SUSPENDED', formation: 'SIEGE' })).toBe(
      'sursis à statuer',
    );
    expect(docNominationFileOutcomeLabel({ outcome: 'WITHDRAWN', formation: 'SIEGE' })).toBe('retrait');
  });

  it.each([
    ['ASSESSING', 'sursis à statuer'],
    ['WAITING_DSJ', 'sursis à statuer'],
    ['REMOVED', 'retrait'],
    ['WITHDRAWN', 'retrait'],
  ] satisfies [NominationFileOutcomeEnum, string][])(
    'a nomination file outcome %s appears as "%s" in the documents',
    (outcome, label) => {
      const docOutcome = nominationFileOutcomeToDocNominationFileOutcome(outcome);

      expect(docNominationFileOutcomeLabel({ outcome: docOutcome, formation: 'SIEGE' })).toBe(label);
    },
  );
});
