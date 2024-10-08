import { ChangeRuleValidationStateUseCase } from './change-rule-validation-state.use-case';
import { ReportBuilder } from '../../models/report.builder';
import {
  NominationFileReport,
  NominationFileRuleName,
} from '../../models/nomination-file-report';
import { FakeNominationFileReportRepository } from 'src/reporter-context/adapters/secondary/repositories/fake-nomination-file-report.repository';

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
        NominationFileRuleName.OVERSEAS_TO_OVERSEAS,
        expectValidated,
      );

      await expectChangedRuleValidationState(aReport, expectValidated);
    },
  );

  const givenSomeReportExistWithTestedRuleAt = (
    initialValidationState: boolean,
  ): NominationFileReport => {
    const aReport = new ReportBuilder()
      .withOverseasToOverseasRuleValidated(initialValidationState)
      .build();

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
        [NominationFileRuleName.OVERSEAS_TO_OVERSEAS]: {
          validated: expectValidated,
        },
      },
    });
  };
});
