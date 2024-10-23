import { FakeReportRetrievalVMQuery } from 'src/reporter-context/adapters/secondary/gateways/repositories/fake-report-retrieval-vm.query';
import { ReportRetrievalVM } from 'shared-models';
import { ReportRetrievalVMBuilder } from '../../models/report-retrieval-vm.builder';
import { RetrieveReportUseCase } from './retrieve-report.use-case';

describe('Report Retrieval', () => {
  let fakeReportRetrievalVMQuery: FakeReportRetrievalVMQuery;

  beforeEach(() => {
    fakeReportRetrievalVMQuery = new FakeReportRetrievalVMQuery();
    fakeReportRetrievalVMQuery.reports = {
      [aReportVM.id]: aReportVM,
    };
  });

  it('retrieves a report', async () => {
    const retrieveReport = new RetrieveReportUseCase(
      fakeReportRetrievalVMQuery,
    );
    expect(await retrieveReport.execute(aReportVM.id)).toEqual(aReportVM);
  });

  const aReportVM: ReportRetrievalVM = new ReportRetrievalVMBuilder().build();
});
