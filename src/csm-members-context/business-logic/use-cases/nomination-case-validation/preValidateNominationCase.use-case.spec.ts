import { DateOnly } from 'src/shared-kernel/business-logic/models/dateOnly';
import { FakeNominationCaseRepository } from '../../../adapters/secondary/repositories/FakeNominationCaseRepository';
import { NominationCaseBuilder } from '../../models/NominationCaseBuilder';
import { PreValidateNominationCaseUseCase } from './preValidateNominationCase.use-case';

const testData = [
  {
    nominationCase: new NominationCaseBuilder().build(),
    expected: {
      transferTimeValidated: true,
    },
  },
  {
    nominationCase: new NominationCaseBuilder()
      .withCurrentPositionStartDate(new DateOnly(2022, 3, 20))
      .build(),
    expected: {
      transferTimeValidated: false,
    },
  },

  {
    nominationCase: new NominationCaseBuilder()
      .withProfiledPosition(true)
      .build(),
    expected: {
      profiledPositionValidated: true,
    },
  },
  {
    nominationCase: new NominationCaseBuilder()
      .withProfiledPosition(false)
      .build(),
    expected: {
      profiledPositionValidated: false,
    },
  },

  {
    nominationCase: new NominationCaseBuilder()
      .withCurrentPositionCity('PARIS')
      .withNewPositionCity('PARIS')
      .build(),
    expected: {
      overseasToOverseasValidated: true,
    },
  },
  {
    nominationCase: new NominationCaseBuilder()
      .withCurrentPositionCity('PARIS')
      .withNewPositionCity('PITRE')
      .build(),
    expected: {
      overseasToOverseasValidated: true,
    },
  },
  {
    nominationCase: new NominationCaseBuilder()
      .withCurrentPositionCity('PITRE')
      .withNewPositionCity('PITRE')
      .build(),
    expected: {
      overseasToOverseasValidated: false,
    },
  },
  {
    nominationCase: new NominationCaseBuilder().withNoAssignment().build(),
    expected: {
      overseasToOverseasValidated: false,
    },
  },
  {
    nominationCase: new NominationCaseBuilder().withNoAssignment().build(),
    expected: {
      overseasToOverseasValidated: false,
    },
  },
  {
    nominationCase: new NominationCaseBuilder().withSecondment().build(),
    expected: {
      overseasToOverseasValidated: false,
    },
  },
];

describe('Pre Validate Nomination Case', () => {
  it.each(testData)(
    'validation of nomination case $nominationCase should be $expected',
    async ({ nominationCase, expected }) => {
      // Given
      const nominationCaseRepository = new FakeNominationCaseRepository();
      nominationCaseRepository.nominationCases = {
        [nominationCase.id]: nominationCase,
      };

      // When
      const validation = await new PreValidateNominationCaseUseCase(
        nominationCaseRepository,
      ).execute(nominationCase.id);

      // Then
      expect(validation).toMatchObject(expected);
    },
  );
});
