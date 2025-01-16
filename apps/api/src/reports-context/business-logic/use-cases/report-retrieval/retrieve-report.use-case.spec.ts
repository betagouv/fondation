import { ReportRetrievalVM } from 'shared-models';
import { FakeReportRetrievalVMQuery } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-retrieval-vm.query';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { ReportRetrievalQueried } from '../../gateways/queries/report-retrieval-vm.query';
import {
  ReportAttachedFile,
  ReportAttachedFileSnapshot,
} from '../../models/report-attached-file';
import { ReportAttachedFiles } from '../../models/report-attached-files';
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
      [aReportWithFileQueried.id]: aReportWithFileQueried,
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

  it('retrieves a report with a file', async () => {
    const retrieveReport = new RetrieveReportUseCase(
      fakeReportRetrievalVMQuery,
      reportFileService,
    );
    expect(
      await retrieveReport.execute(aReportWithFileQueried.id, reporterId),
    ).toEqual(aReportWithFileVM);
  });
});

const aReportQueried =
  new ReportRetrievalBuilder<ReportRetrievalQueried>().buildQueried();
const aReportVM = new ReportRetrievalBuilder<ReportRetrievalVM>().buildVM();

const aFile: ReportAttachedFileSnapshot = {
  createdAt: new Date(2025, 10, 10),
  reportId: 'report-with-file-id',
  name: 'file-name',
  fileId: 'file-id',
};
const aReportWithFileQueried: ReportRetrievalQueried =
  new ReportRetrievalBuilder<ReportRetrievalQueried>()
    .with('id', aFile.reportId)
    .with(
      'attachedFilesVO',
      new ReportAttachedFiles([ReportAttachedFile.fromSnapshot(aFile)]),
    )
    .buildQueried();

const aReportWithFileVM: ReportRetrievalVM =
  ReportRetrievalBuilder.fromQueriedToVM(aReportWithFileQueried)
    .with('attachedFiles', [
      {
        name: aFile.name,
        signedUrl: 'signed-url',
      },
    ])
    .buildVM();
