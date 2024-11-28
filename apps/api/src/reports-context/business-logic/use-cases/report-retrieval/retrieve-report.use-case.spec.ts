import { FakeReportRetrievalVMQuery } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-retrieval-vm.query';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { ReportRetrievalQueried } from '../../gateways/queries/report-retrieval-vm.query';
import { ReportRetrievalBuilder } from '../../models/report-retrieval-vm.builder';
import { RetrieveReportUseCase } from './retrieve-report.use-case';
import { ReportRetrievalVM } from 'shared-models';

const fileName = 'file-name';

describe('Report Retrieval', () => {
  let fakeReportRetrievalVMQuery: FakeReportRetrievalVMQuery;
  let reportFileService: FakeReportFileService;

  beforeEach(() => {
    fakeReportRetrievalVMQuery = new FakeReportRetrievalVMQuery();
    fakeReportRetrievalVMQuery.reports = {
      [aReportQueried.id]: aReportQueried,
    };
    reportFileService = new FakeReportFileService();
    reportFileService.files[fileName] = {
      name: 'file-name',
      signedUrl: 'signed-url',
    };
  });

  it('retrieves a report', async () => {
    const retrieveReport = new RetrieveReportUseCase(
      fakeReportRetrievalVMQuery,
      reportFileService,
    );
    expect(await retrieveReport.execute(aReportQueried.id)).toEqual(aReportVM);
  });
});

const aReportQueried: ReportRetrievalQueried =
  new ReportRetrievalBuilder<ReportRetrievalQueried>()
    .with('attachedFileIds', [fileName])
    .buildQueried();

const aReportVM: ReportRetrievalVM = ReportRetrievalBuilder.fromQueriedToVM(
  aReportQueried,
)
  .with('attachedFiles', [
    {
      name: 'file-name',
      signedUrl: 'signed-url',
    },
  ])
  .buildVM();
