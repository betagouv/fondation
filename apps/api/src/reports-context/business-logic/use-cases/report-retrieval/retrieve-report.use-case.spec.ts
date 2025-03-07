import { ReportRetrievalVM } from 'shared-models';
import { FakeReportRetrievalVMQuery } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-retrieval-vm.query';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { ReportRetrievalQueried } from '../../gateways/queries/report-retrieval-vm.query';
import { ReportAttachedFileBuilder } from '../../models/report-attached-file.builder';
import { ReportRetrievalBuilder } from '../../models/report-retrieval-vm.builder';
import { RetrieveReportUseCase } from './retrieve-report.use-case';

const reporterId = 'reporter-id';

describe('Report Retrieval', () => {
  let fakeReportRetrievalVMQuery: FakeReportRetrievalVMQuery;
  let reportFileService: FakeReportFileService;

  beforeEach(() => {
    fakeReportRetrievalVMQuery = new FakeReportRetrievalVMQuery();
    fakeReportRetrievalVMQuery.reports = {
      [aReportQueried.id]: aReportQueried,
    };
    reportFileService = new FakeReportFileService();
    reportFileService.files[aFile.fileId] = {
      name: aFile.name,
      signedUrl: 'signed-url',
    };
  });

  it('retrieves a report', async () => {
    const retrieveReport = new RetrieveReportUseCase(
      fakeReportRetrievalVMQuery,
      reportFileService,
    );
    expect(await retrieveReport.execute(aReportQueried.id, reporterId)).toEqual(
      aReportVM,
    );
  });
});

const aFile = new ReportAttachedFileBuilder().build();
const aReportQueried = new ReportRetrievalBuilder<ReportRetrievalQueried>()
  .with('files', [aFile])
  .buildQueried();
const aReportVM = new ReportRetrievalBuilder<ReportRetrievalVM>()
  .with('attachedFiles', [
    {
      usage: aFile.usage,
      name: aFile.name,
      signedUrl: 'signed-url',
    },
  ])
  .buildVM();
