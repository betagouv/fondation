import { FakeReportAttachedFileRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-attached-file.repository';
import { FakeReportFileService } from 'src/reports-context/adapters/secondary/gateways/services/fake-report-file-service';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { Readable } from 'stream';
import { ReportFileService } from '../../gateways/services/report-file-service';
import { UploadReportAttachedFileUseCase } from './upload-report-attached-file';

describe('Upload Report Attached File Use Case', () => {
  let reportAttachedFileRepository: FakeReportAttachedFileRepository;
  let uuidGenerator: DeterministicUuidGenerator;
  let reportFileService: ReportFileService;

  beforeEach(() => {
    reportAttachedFileRepository = new FakeReportAttachedFileRepository();
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [aFile.id];
    reportFileService = new FakeReportFileService();
  });

  it('informs about a new file uploaded', async () => {
    await uploadFile();
    expect(Object.values(reportAttachedFileRepository.files)).toEqual([
      {
        id: aFile.id,
        reportId: aFile.reportId,
        fileId: aFile.fileId,
      },
    ]);
  });

  const uploadFile = async () => {
    await new UploadReportAttachedFileUseCase(
      reportAttachedFileRepository,
      uuidGenerator,
      reportFileService,
    ).execute(aFile.reportId, aFile.name, new Readable());
  };
});

const aFile = {
  id: '123',
  reportId: 'report-id',
  name: 'report.pdf',
  mimeType: 'application/pdf',
  size: 1234,
  fileId: 'file-id',
};
