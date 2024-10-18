import { FakeReportListingVMRepository } from 'src/reporter-context/adapters/secondary/repositories/fake-report-listing-vm.repository';
import { ReportListItemVM } from '@/shared-models';
import { ListReportsUseCase } from './list-reports.use-case';
import { Magistrat, NominationFile, Transparency } from '@/shared-models';

describe('List reports', () => {
  let reportListingVMRepository: FakeReportListingVMRepository;

  beforeEach(() => {
    reportListingVMRepository = new FakeReportListingVMRepository();
  });

  it("returns an empty list when there's no reports", async () => {
    expectReports([]);
  });

  it('lists reports', async () => {
    reportListingVMRepository.reportsList = [aReport];
    expectReports([aReport]);
  });

  const expectReports = async (reports: ReportListItemVM[]) => {
    expect(
      await new ListReportsUseCase(reportListingVMRepository).execute(),
    ).toEqual({
      data: reports,
    });
  };

  const aReport: ReportListItemVM = {
    id: '1',
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
  };
});
