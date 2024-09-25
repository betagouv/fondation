import { DateOnly } from 'src/shared-kernel/business-logic/models/dateOnly';
import { FakeNominationCaseRepository } from '../../../adapters/secondary/repositories/FakeNominationCaseRepository';
import { NominationCaseBuilder } from '../../models/NominationCaseBuilder';
import { PreValidateNominationCaseUseCase } from './preValidateNominationCase.use-case';
import { NominationCase } from '../../models/NominationCase';
import { PositionTitle } from '../../models/Position';

const testData: [NominationCase, object][] = [
  [
    new NominationCaseBuilder().build(),
    {
      transferTimeValidated: true,
    },
  ],
  [
    new NominationCaseBuilder()
      .withCurrentPositionStartDate(new DateOnly(2022, 3, 20))
      .build(),
    {
      transferTimeValidated: false,
    },
  ],

  [
    new NominationCaseBuilder().withProfiledPosition(true).build(),
    {
      profiledPositionValidated: true,
    },
  ],
  [
    new NominationCaseBuilder().withProfiledPosition(false).build(),
    {
      profiledPositionValidated: false,
    },
  ],

  [
    new NominationCaseBuilder()
      .withCurrentPositionCity('PARIS')
      .withNewPositionCity('PARIS')
      .build(),
    {
      overseasToOverseasValidated: true,
    },
  ],
  [
    new NominationCaseBuilder()
      .withCurrentPositionCity('PARIS')
      .withNewPositionCity('PITRE')
      .build(),
    {
      overseasToOverseasValidated: true,
    },
  ],
  [
    new NominationCaseBuilder()
      .withCurrentPositionCity('PITRE')
      .withNewPositionCity('PITRE')
      .build(),
    {
      overseasToOverseasValidated: false,
    },
  ],
  [
    new NominationCaseBuilder().withNoAssignment().build(),
    {
      overseasToOverseasValidated: false,
    },
  ],
  [
    new NominationCaseBuilder().withSecondment().build(),
    {
      overseasToOverseasValidated: false,
    },
  ],
  [
    new NominationCaseBuilder()
      .withCurrentPositionTitle(PositionTitle.PROCUREUR_GENERAL) // Parquet - Cour d'appel
      .withNewPositionTitle(PositionTitle.PREMIER_PRESIDENT) // Siège - Cour d'appel
      .withCurrentPositionCity('PARIS')
      .withNewPositionCity('BOBIGNY')
      .build(),
    {
      judiciaryRoleAndJuridictionDegreeChangeValidated: true,
    },
  ],
  [
    new NominationCaseBuilder()
      .withCurrentPositionTitle(PositionTitle.PRESIDENT) // Siège - Tribunal judiciaire
      .withNewPositionTitle(PositionTitle.PREMIER_PRESIDENT) // Siège - Cour d'appel
      .withCurrentPositionCity('PARIS')
      .withNewPositionCity('BOBIGNY')
      .build(),
    {
      judiciaryRoleAndJuridictionDegreeChangeValidated: true,
    },
  ],
  [
    new NominationCaseBuilder()
      .withCurrentPositionTitle(PositionTitle.PROCUREUR_GENERAL) // Parquet - Cour d'appel
      .withNewPositionTitle(PositionTitle.AVOCAT_GENERAL) // Parquet - Cour d'appel
      .withCurrentPositionCity('PARIS')
      .withNewPositionCity('BOBIGNY')
      .build(),
    {
      judiciaryRoleAndJuridictionDegreeChangeValidated: true,
    },
  ],
  [
    new NominationCaseBuilder()
      .withCurrentPositionTitle(PositionTitle.PRESIDENT) // Siège - Tribunal judiciaire
      .withNewPositionTitle(PositionTitle.PROCUREUR_GENERAL) // Parquet - Cour d'appel
      .withCurrentPositionCity('PARIS')
      .withNewPositionCity('BOBIGNY')
      .build(),
    {
      judiciaryRoleAndJuridictionDegreeChangeValidated: false,
    },
  ],
  [
    new NominationCaseBuilder()
      .withCurrentPositionTitle(PositionTitle.PRESIDENT) // Siège - Tribunal judiciaire
      .withNewPositionTitle(PositionTitle.PROCUREUR_GENERAL) // Parquet - Cour d'appel
      .withCurrentPositionCity('PARIS')
      .withNewPositionCity('PITRE')
      .build(),
    {
      judiciaryRoleAndJuridictionDegreeChangeValidated: true,
    },
  ],
];

describe('Pre Validate Nomination Case', () => {
  it.each(testData)(
    'validation of: %s should be \n%p',
    async (nominationCase, expected) => {
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
