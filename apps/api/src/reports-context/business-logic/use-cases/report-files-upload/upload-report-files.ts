import { ReportFileUsage } from 'shared-models';
import { DossierDeNominationTranslator } from 'src/reports-context/adapters/secondary/gateways/services/dossier-de-nomination.translator';
import { ReporterTranslatorService } from 'src/reports-context/adapters/secondary/gateways/services/reporter-translator.service';
import { FileUpload } from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { NonExistingReportError } from '../../errors/non-existing-report.error';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { ReportFileService } from '../../gateways/services/report-file-service';

export const MAX_RETRIES_OF_UPLOADS = 2;

export interface ReportFile {
  fileId: string;
  name: string;
  buffer: Buffer;
}

export class UploadReportFilesUseCase {
  constructor(
    private readonly reportFileService: ReportFileService,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly reportRepository: ReportRepository,
    private readonly reporterTranslatorService: ReporterTranslatorService,
    private readonly dossierDeNominationTranslator: DossierDeNominationTranslator,
  ) {}

  async execute(
    reportId: string,
    files: ReportFile[],
    reporterId: string,
    fileUsage: ReportFileUsage,
    retries = MAX_RETRIES_OF_UPLOADS,
  ): Promise<void> {
    if (files.length === 0) return;

    return this.transactionPerformer.perform(
      async (trx) => {
        const report = await this.reportRepository.byId(reportId)(trx);
        if (!report) throw new NonExistingReportError();

        const reporter =
          await this.reporterTranslatorService.reporterWithId(reporterId);

        for (const file of files) {
          report.createAttachedFile(file.name, fileUsage, file.fileId);
        }

        await this.reportRepository.save(report)(trx);

        const dossierDeNomination =
          await this.dossierDeNominationTranslator.dossierDeNomination(
            report.dossierDeNominationId,
          );
        const filePath = report.generateAttachedFilePath(
          reporter,
          dossierDeNomination,
        );
        const fileUploads: FileUpload[] = files.map((f) => ({
          file: report.attachedFiles!.getByName(f.name)!,
          buffer: f.buffer,
          path: filePath,
        }));
        await this.reportFileService.uploadFiles(fileUploads, filePath);
      },
      { retries },
    );
  }
}
