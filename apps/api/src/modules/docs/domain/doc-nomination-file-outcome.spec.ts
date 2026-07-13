import { Magistrat } from 'shared-models';

import { NominationFileOutcomeEnum } from 'src/modules/session/domain/nomination-file-outcome';

import {
  docNominationFileOutcomeLabel,
  nominationFileOutcomeToDocNominationFileOutcome,
} from './doc-nomination-file-outcome';

describe('docNominationFileOutcomeLabel', () => {
  it('labels the decision outcomes according to the formation', () => {
    expect(
      docNominationFileOutcomeLabel({ outcome: 'VALIDATED', formation: Magistrat.Formation.PARQUET }),
    ).toBe('avis favorable');
    expect(
      docNominationFileOutcomeLabel({ outcome: 'VALIDATED', formation: Magistrat.Formation.SIEGE }),
    ).toBe('avis conforme');
    expect(
      docNominationFileOutcomeLabel({ outcome: 'NON_VALIDATED', formation: Magistrat.Formation.PARQUET }),
    ).toBe('avis défavorable');
    expect(
      docNominationFileOutcomeLabel({ outcome: 'NON_VALIDATED', formation: Magistrat.Formation.SIEGE }),
    ).toBe('avis non conforme');
  });

  it('labels the grouped outcomes with the official documents vocabulary', () => {
    expect(
      docNominationFileOutcomeLabel({ outcome: 'SUSPENDED', formation: Magistrat.Formation.SIEGE }),
    ).toBe('sursis à statuer');
    expect(
      docNominationFileOutcomeLabel({ outcome: 'WITHDRAWN', formation: Magistrat.Formation.SIEGE }),
    ).toBe('retrait');
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

      expect(
        docNominationFileOutcomeLabel({ outcome: docOutcome, formation: Magistrat.Formation.SIEGE }),
      ).toBe(label);
    },
  );
});
