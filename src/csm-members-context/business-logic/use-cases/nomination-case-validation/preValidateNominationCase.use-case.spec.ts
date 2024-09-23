import { DateOnly } from 'src/shared-kernel/business-logic/models/dateOnly';
import { FakeNominationCaseRepository } from '../../../adapters/secondary/repositories/FakeNominationCaseRepository';
import { NominationCase } from '../../models/NominationCase';
import { PreValidateNominationCaseUseCase } from './preValidateNominationCase.use-case';

describe('Pre Validate Nomination Case', () => {
  it.each`
    nominationCaseId   | currentPositionStartDate     | takingOfficeDate             | expectedApproval
    ${'nomination-id'} | ${new DateOnly(2022, 1, 20)} | ${new DateOnly(2025, 1, 20)} | ${true}
    ${'nomination-id'} | ${new DateOnly(2022, 3, 20)} | ${new DateOnly(2025, 1, 20)} | ${false}
  `(
    'validation of taking office date should be $expectedApproval',
    async ({
      nominationCaseId,
      currentPositionStartDate,
      takingOfficeDate,
      expectedApproval,
    }) => {
      // Given
      const nominationCaseRepository = new FakeNominationCaseRepository();
      nominationCaseRepository.nominationCases = {
        [nominationCaseId]: new NominationCase(
          nominationCaseId,
          currentPositionStartDate,
          takingOfficeDate,
        ),
      };

      // When
      const approval = await new PreValidateNominationCaseUseCase(
        nominationCaseRepository,
      ).execute(nominationCaseId);

      // Then
      expect(approval).toBe(expectedApproval);
    },
  );
});
