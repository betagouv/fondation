import { FakeReportListingVMRepository } from 'src/reporter-context/adapters/secondary/repositories/FakeReportListingVM.repository';
import { DateOnly } from 'src/shared-kernel/business-logic/models/dateOnly';
import { ReportListItemVM } from '../../models/ReportsListingVM';
import { ListReportsUseCase } from './listReports.use-case';

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
    title: 'a title',
    dueDate: '2030-10-05',
  };
});
