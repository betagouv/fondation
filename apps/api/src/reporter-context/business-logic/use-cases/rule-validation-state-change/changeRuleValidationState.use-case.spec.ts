import { FakeNominationFileReportRepository } from 'src/reporter-context/adapters/secondary/repositories/FakeNominationFileReport.repository';
import {
  NominationFileReport,
  NominationFileRule,
} from '../../models/NominationFileReport';
import { ChangeRuleValidationStateUseCase } from './changeRuleValidationState.use-case';

describe('Change Rule Validation State', () => {
  let nominationFileReportRepository: FakeNominationFileReportRepository;

  beforeEach(() => {
    nominationFileReportRepository = new FakeNominationFileReportRepository();
  });

  const testData = [
    { initialValidationState: true, expectValidated: false },
    { initialValidationState: false, expectValidated: true },
  ];
  it.each(testData)(
    'switch an oversea to oversea rule validation state from $initialValidationState to $expectValidated',
    async ({ initialValidationState, expectValidated }) => {
      const aReport = givenSomeReportExistWithTestedRuleAt(
        initialValidationState,
      );

      const changeRuleValidationStateUseCase =
        new ChangeRuleValidationStateUseCase(nominationFileReportRepository);

      await changeRuleValidationStateUseCase.execute(
        aReport.id,
        NominationFileRule.OVERSEAS_TO_OVERSEAS,
        expectValidated,
      );

      await expectChangedRuleValidationState(aReport, expectValidated);
    },
  );

  const givenSomeReportExistWithTestedRuleAt = (
    initialValidationState: boolean,
  ): NominationFileReport => {
    const aReport = {
      id: '1',
      managementRules: {
        [NominationFileRule.PROFILED_POSITION]: {
          validated: true,
        },
        [NominationFileRule.OVERSEAS_TO_OVERSEAS]: {
          validated: initialValidationState,
        },
      },
    };

    nominationFileReportRepository.reports = {
      [aReport.id]: aReport,
    };

    return aReport;
  };

  const expectChangedRuleValidationState = async (
    report: NominationFileReport,
    expectValidated: boolean,
  ) => {
    const savedReport = await nominationFileReportRepository.byId(report.id);

    expect(savedReport).toEqual({
      ...report,
      managementRules: {
        ...report.managementRules,
        [NominationFileRule.OVERSEAS_TO_OVERSEAS]: {
          validated: expectValidated,
        },
      },
    });
  };
});
