import { FakeReportListingVMRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-listing-vm.repository';
import { ReportListItemVM } from 'shared-models';
import { ListReportsUseCase } from './list-reports.use-case';
import { Magistrat, NominationFile, Transparency } from 'shared-models';

const reporterId = 'reporter-id';

describe('List reports', () => {
  let reportListingVMRepository: FakeReportListingVMRepository;

  beforeEach(() => {
    reportListingVMRepository = new FakeReportListingVMRepository();
  });

  it("returns an empty list when there's no reports", async () => {
    await expectReports([]);
  });

  it('lists reports', async () => {
    reportListingVMRepository.reportsList = { [reporterId]: [aReport] };
    await expectReports([aReport]);
  });

  it("does not list reports that the user doesn't own", async () => {
    reportListingVMRepository.reportsList = {
      'another-reporter-id': [aReportNotOwned],
    };
    await expectReports([]);
  });

  const expectReports = async (reports: ReportListItemVM[]) => {
    expect(
      await new ListReportsUseCase(reportListingVMRepository).execute(
        reporterId,
      ),
    ).toEqual({
      data: reports,
    });
  };

  const aReport: ReportListItemVM = {
    id: '1',
    folderNumber: 15,
    state: NominationFile.ReportState.NEW,
    dueDate: {
      year: 2030,
      month: 10,
      day: 5,
    },
    formation: Magistrat.Formation.PARQUET,
    name: 'a name',
    transparency: Transparency.MARCH_2025,
    grade: Magistrat.Grade.HH,
    targettedPosition: 'a position',
    observersCount: 1,
  };

  const aReportNotOwned: ReportListItemVM = {
    id: 'report-not-owned-id',
    folderNumber: 20,
    state: NominationFile.ReportState.NEW,
    dueDate: {
      year: 2031,
      month: 11,
      day: 6,
    },
    formation: Magistrat.Formation.PARQUET,
    name: 'another name',
    transparency: Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024,
    grade: Magistrat.Grade.HH,
    targettedPosition: 'another position',
    observersCount: 2,
  };
});
